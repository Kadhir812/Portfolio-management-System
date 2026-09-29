import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRightLeft, Plus, Save, Trash2 } from 'lucide-react';
import { api } from '../api/client';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

const money = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(v || 0));
const dateLabel = (v) => v ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(`${v}T12:00:00`)) : '';
const name = (v) => (v || '').replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (x) => x.toUpperCase());

export function RebalancePage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const tradeDate = params.get('date') || new Date().toISOString().slice(0, 10);
  const [valuation, setValuation] = useState(null);
  const [eligible, setEligible] = useState([]);
  const [orders, setOrders] = useState([]);
  const [buyIsin, setBuyIsin] = useState('');
  const [buyShares, setBuyShares] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.holdings.valuation(id, tradeDate), api.holdings.eligibleSecurities(id, tradeDate)])
      .then(([data, securities]) => { setValuation(data); setEligible(securities); })
      .catch((e) => setError(e.message || 'Unable to load rebalance details'))
      .finally(() => setLoading(false));
  }, [id, tradeDate]);

  useEffect(() => {
    if (!valuation) return;
    const generated = [];
    const byClass = new Map();
    valuation.holdings.forEach((holding) => byClass.set(holding.assetClass, (byClass.get(holding.assetClass) || 0) + Number(holding.value)));
    valuation.allocations.forEach((allocation) => {
      const classValue = byClass.get(allocation.assetClass) || 0;
      if (!classValue) return;
      const valueDelta = Number(valuation.totalValue) * Number(allocation.targetPercentage) / 100 - classValue;
      valuation.holdings.filter((h) => h.assetClass === allocation.assetClass).forEach((holding) => {
        const signedShares = valueDelta * Number(holding.value) / classValue / Number(holding.currentPrice);
        if (Math.abs(signedShares) > 0.000001) generated.push({ isin: holding.isin, symbol: holding.symbol, assetClass: holding.assetClass, unitPrice: Number(holding.currentPrice), signedShares });
      });
    });
    setOrders(generated);
  }, [valuation]);

  const orderTotals = useMemo(() => orders.reduce((sum, order) => sum + order.signedShares * order.unitPrice, 0), [orders]);

  const addBuy = () => {
    const security = eligible.find((item) => item.isin === buyIsin);
    if (!security || Number(buyShares) <= 0) return;
    setOrders((current) => {
      const index = current.findIndex((row) => row.isin === security.isin);
      const next = [...current];
      if (index >= 0) next[index] = { ...next[index], signedShares: next[index].signedShares + Number(buyShares) };
      else next.push({ isin: security.isin, symbol: security.symbol, assetClass: security.assetClass, unitPrice: Number(security.latestPrice), signedShares: Number(buyShares) });
      return next;
    });
    setBuyIsin(''); setBuyShares('');
  };

  const submit = async () => {
    const trades = orders.filter((order) => Number(order.signedShares)).map(({ isin, signedShares }) => ({ isin, signedShares: Number(signedShares) }));
    if (!trades.length) { setError('Add at least one buy or sell trade.'); return; }
    setSaving(true); setError('');
    try {
      await api.holdings.rebalance(id, { tradeDate, trades });
      navigate(`/portfolios/${id}?date=${tradeDate}`, { replace: true });
    } catch (e) { setError(e.message || 'Unable to apply rebalance trades'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="p-6 text-muted-foreground">Loading rebalance proposal…</div>;
  return <div className="mx-auto max-w-6xl space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Trade simulator</p><h2 className="mt-1 text-3xl font-bold">Rebalance portfolio</h2><p className="mt-1 text-sm text-muted-foreground">Trades are priced with historical market data for {dateLabel(tradeDate)}.</p></div>
      <Link to={`/portfolios/${id}?date=${tradeDate}`} className="inline-flex items-center gap-2 rounded-md border border-input px-4 py-2 text-sm"><ArrowLeft className="h-4 w-4" />Dashboard</Link>
    </div>
    {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">{error}</div>}
    {!valuation?.allocations?.length && <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">Attach an investment theme to calculate target allocations before rebalancing.</div>}
    {valuation && <>
      <div className="grid gap-4 md:grid-cols-3"><Card className="p-5"><p className="text-sm text-muted-foreground">Portfolio value</p><p className="mt-2 text-2xl font-bold">{money(valuation.totalValue)}</p></Card><Card className="p-5"><p className="text-sm text-muted-foreground">Net trade value</p><p className="mt-2 text-2xl font-bold">{money(orderTotals)}</p><p className="text-xs text-muted-foreground">Positive means net buy; negative means net sell.</p></Card><Card className="p-5"><p className="text-sm text-muted-foreground">Trade date</p><p className="mt-2 text-2xl font-bold">{dateLabel(tradeDate)}</p></Card></div>
      <Card><CardHeader><CardTitle>Target allocation and drift</CardTitle></CardHeader><CardContent><div className="grid gap-3 md:grid-cols-2">{valuation.allocations.map((row) => <div className="flex items-center justify-between rounded-xl border border-border p-3" key={row.assetClass}><div><p className="font-medium">{name(row.assetClass)}</p><p className="text-xs text-muted-foreground">Target {Number(row.targetPercentage).toFixed(1)}% · Current {Number(row.currentPercentage).toFixed(1)}%</p></div><span className={row.alert ? 'font-semibold text-amber-600' : 'text-muted-foreground'}>{Number(row.driftPercentagePoints) > 0 ? '+' : ''}{Number(row.driftPercentagePoints).toFixed(1)} pp</span></div>)}</div></CardContent></Card>
      <Card><CardHeader><CardTitle>Proposed trades</CardTitle></CardHeader><CardContent>
        <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-muted-foreground"><tr><th className="py-2">Security</th><th>Asset class</th><th>Price</th><th>Shares to buy / sell</th><th>Trade value</th><th /></tr></thead><tbody>
          {orders.map((order, index) => <tr key={order.isin} className="border-t border-border"><td className="py-3 font-medium">{order.symbol}</td><td>{name(order.assetClass)}</td><td>{money(order.unitPrice)}</td><td><input type="number" step="0.0001" value={Number(order.signedShares.toFixed(4))} onChange={(event) => setOrders((current) => current.map((item, row) => row === index ? { ...item, signedShares: Number(event.target.value) } : item))} className="w-36 rounded-md border border-input bg-background px-2 py-1.5" /></td><td>{money(order.signedShares * order.unitPrice)}</td><td><button type="button" aria-label={`Remove ${order.symbol}`} onClick={() => setOrders((current) => current.filter((_, row) => row !== index))} className="text-red-600"><Trash2 className="h-4 w-4" /></button></td></tr>)}
          {!orders.length && <tr><td colSpan="6" className="py-5 text-muted-foreground">No proposed trades. Add a buy order or adjust the allocation manually.</td></tr>}
        </tbody></table></div>
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Add a buy order</CardTitle></CardHeader><CardContent><div className="grid gap-3 md:grid-cols-[1fr_180px_auto]"><select value={buyIsin} onChange={(e) => setBuyIsin(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="">Choose security</option>{eligible.map((s) => <option key={s.isin} value={s.isin}>{s.symbol} · {name(s.assetClass)} · {money(s.latestPrice)}</option>)}</select><input type="number" min="0.0001" step="any" value={buyShares} onChange={(e) => setBuyShares(e.target.value)} placeholder="Shares to buy" className="rounded-md border border-input bg-background px-3 py-2 text-sm" /><Button onClick={addBuy} disabled={!buyIsin || Number(buyShares) <= 0}><Plus className="mr-2 h-4 w-4" />Add buy</Button></div></CardContent></Card>
      <div className="flex justify-end"><Button onClick={submit} disabled={saving || !orders.length} className="gap-2"><Save className="h-4 w-4" />{saving ? 'Applying trades…' : 'Apply rebalance'}</Button></div>
    </>}
  </div>;
}
