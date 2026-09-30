import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRightLeft, Save, Trash2 } from 'lucide-react';
import { api } from '../api/client';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { localDateString } from '../lib/utils';

const money = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(v || 0));
const dateLabel = (v) => v ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(`${v}T12:00:00`)) : '';
const name = (v) => (v || '').replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (x) => x.toUpperCase());
const driftLabel = (value) => {
  const rounded = Number(value.toFixed(1));
  return `${rounded > 0 ? '+' : ''}${(Object.is(rounded, -0) ? 0 : rounded).toFixed(1)} pp`;
};
const driftTone = (value) => Math.abs(value) > 5
  ? 'bg-red-500/10 text-red-700 dark:text-red-300'
  : 'bg-green-500/10 text-green-700 dark:text-green-300';

export function RebalancePage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const tradeDate = params.get('date') || localDateString();
  const [valuation, setValuation] = useState(null);
  const [portfolioAmount, setPortfolioAmount] = useState(0);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.holdings.valuation(id, tradeDate), api.portfolios.get(id)])
      .then(([data, portfolio]) => {
        setValuation(data);
        setPortfolioAmount(Number(portfolio.amount || 0));
      })
      .catch((e) => setError(e.message || 'Unable to load rebalance details'))
      .finally(() => setLoading(false));
  }, [id, tradeDate]);

  useEffect(() => {
    if (!valuation) return;
    const generated = [];
    const byClass = new Map();
    valuation.holdings.forEach((holding) => byClass.set(holding.assetClass, (byClass.get(holding.assetClass) || 0) + Number(holding.value)));
    valuation.allocations.forEach((allocation) => {
      if (Number(allocation.driftPercentagePoints) <= 5) return;
      const classValue = byClass.get(allocation.assetClass) || 0;
      if (!classValue) return;
      const valueDelta = Number(valuation.totalValue) * Number(allocation.targetPercentage) / 100 - classValue;
      if (valueDelta >= 0) return;
      valuation.holdings.filter((h) => h.assetClass === allocation.assetClass).forEach((holding) => {
        const signedShares = valueDelta * Number(holding.value) / classValue / Number(holding.currentPrice);
        if (Math.abs(signedShares) > 0.000001) generated.push({ securityId: holding.securityId, isin: holding.isin, symbol: holding.symbol, assetClass: holding.assetClass, unitPrice: Number(holding.currentPrice), signedShares });
      });
    });
    setOrders(generated);
  }, [valuation]);

  const orderTotals = useMemo(() => orders.reduce((sum, order) => sum + order.signedShares * order.unitPrice, 0), [orders]);
  const projection = useMemo(() => {
    if (!valuation) return null;
    const valuesByClass = new Map();
    let investedValue = 0;
    valuation.holdings.forEach((holding) => {
      const holdingValue = Number(holding.value);
      investedValue += holdingValue;
      valuesByClass.set(holding.assetClass, (valuesByClass.get(holding.assetClass) || 0) + holdingValue);
    });
    const currentCash = Math.max(Number(valuation.totalValue) - investedValue, 0);
    valuesByClass.set('CASH', currentCash);
    const currentValuesByClass = new Map(valuesByClass);
    let sellValue = 0;
    orders.forEach((order) => {
      const tradeValue = order.signedShares * order.unitPrice;
      valuesByClass.set(order.assetClass, (valuesByClass.get(order.assetClass) || 0) + tradeValue);
      if (tradeValue < 0) sellValue -= tradeValue;
    });
    const projectedInvested = investedValue + orderTotals;
    const projectedCash = currentCash - orderTotals;
    valuesByClass.set('CASH', projectedCash);
    const projectedTotal = projectedInvested + projectedCash;
    return {
      sellValue,
      projectedInvested,
      projectedCash,
      projectedTotal,
      allocations: valuation.allocations.map((allocation) => {
        const targetPercentage = Number(allocation.targetPercentage);
        const currentValue = currentValuesByClass.get(allocation.assetClass) || 0;
        const projectedValue = valuesByClass.get(allocation.assetClass) || 0;
        const projectedPercentage = projectedTotal > 0 ? projectedValue / projectedTotal * 100 : 0;
        const currentTargetValue = Number(valuation.totalValue) * targetPercentage / 100;
        const drift = projectedPercentage - targetPercentage;
        return {
          ...allocation,
          currentValue,
          initialTargetValue: portfolioAmount * targetPercentage / 100,
          addValue: Math.max(currentTargetValue - currentValue, 0),
          projectedValue,
          projectedPercentage,
          projectedDrift: drift
        };
      })
    };
  }, [valuation, orders, orderTotals, portfolioAmount]);

  const submit = async () => {
    const trades = orders.filter((order) => Number(order.signedShares) < 0).map(({ securityId, isin, signedShares }) => ({ securityId, isin, signedShares: Number(signedShares) }));
    if (!trades.length) { setError('Keep at least one sell order to rebalance.'); return; }
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
      <div><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Sell simulator</p><h2 className="mt-1 text-3xl font-bold">Rebalance portfolio</h2><p className="mt-1 text-sm text-muted-foreground">This step proposes sells from overweight asset classes. Add any replacement buys separately from Holdings.</p><p className="mt-1 text-xs text-muted-foreground">Prices use historical market data for {dateLabel(tradeDate)}.</p></div>
      <Link to={`/portfolios/${id}?date=${tradeDate}`} className="inline-flex items-center gap-2 rounded-md border border-input px-4 py-2 text-sm"><ArrowLeft className="h-4 w-4" />Dashboard</Link>
    </div>
    {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">{error}</div>}
    {!valuation?.allocations?.length && <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">Attach an investment theme to calculate target allocations before rebalancing.</div>}
    {valuation && <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5"><p className="text-sm text-muted-foreground">Portfolio value after proposed sells</p><p className="mt-2 text-2xl font-bold">{money(projection.projectedTotal)}</p><p className="text-xs text-muted-foreground">Assumes trades at shown prices, with no fees.</p></Card>
        <Card className="p-5"><p className="text-sm text-muted-foreground">Invested after trades</p><p className="mt-2 text-2xl font-bold">{money(projection.projectedInvested)}</p></Card>
        <Card className="p-5"><p className="text-sm text-muted-foreground">Estimated cash after sells</p><p className={`mt-2 text-2xl font-bold ${projection.projectedCash < 0 ? 'text-red-600' : ''}`}>{money(projection.projectedCash)}</p><p className="text-xs text-muted-foreground">Sale proceeds remain as cash; buys are not included.</p></Card>
        <Card className="p-5"><p className="text-sm text-muted-foreground">Estimated sale proceeds</p><p className="mt-2 text-2xl font-bold">{money(projection.sellValue)}</p><p className="text-xs text-muted-foreground">Only sell orders are applied here.</p></Card>
      </div>
      {projection.projectedCash < -0.005 && <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">Proposed buys exceed estimated cash by {money(-projection.projectedCash)}.</div>}
      <Card>
        <CardHeader>
          <CardTitle>Allocation: current, target, and after sells</CardTitle>
          <p className="text-sm text-muted-foreground">Initial target uses the original investment. Add value estimates what is needed to meet the theme percentage at today’s portfolio value. After includes proposed sells only; proceeds remain as cash.</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="px-3 py-3 font-medium">Asset class</th>
                  <th className="px-3 py-3 text-right font-medium">Theme target · initial</th>
                  <th className="px-3 py-3 text-right font-medium">Current</th>
                  <th className="px-3 py-3 text-right font-medium">Add value</th>
                  <th className="px-3 py-3 text-right font-medium">After proposed sells</th>
                  <th className="px-3 py-3 text-right font-medium">Difference now</th>
                  <th className="px-3 py-3 text-right font-medium">Difference after</th>
                </tr>
              </thead>
              <tbody>
                {projection.allocations.map((row) => {
                  const beforeDrift = Number(row.currentPercentage) - Number(row.targetPercentage);
                  return (
                    <tr key={row.assetClass} className="border-t border-border">
                      <td className="px-3 py-3 font-medium">{name(row.assetClass)}</td>
                      <td className="px-3 py-3 text-right">
                        <div className="font-medium">{Number(row.targetPercentage).toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground">{money(row.initialTargetValue)} initial</div>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div>{Number(row.currentPercentage).toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground">{money(row.currentValue)}</div>
                      </td>
                      <td className="px-3 py-3 text-right font-medium">{row.addValue > 0 ? money(row.addValue) : 'None'}</td>
                      <td className="px-3 py-3 text-right">
                        <div>{row.projectedPercentage.toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground">{money(row.projectedValue)}</div>
                      </td>
                      <td className="px-3 py-3 text-right"><span className={`inline-flex min-w-20 justify-center rounded-full px-2 py-1 text-xs font-semibold ${driftTone(beforeDrift)}`}>{driftLabel(beforeDrift)}</span></td>
                      <td className="px-3 py-3 text-right"><span className={`inline-flex min-w-20 justify-center rounded-full px-2 py-1 text-xs font-semibold ${driftTone(row.projectedDrift)}`}>{driftLabel(row.projectedDrift)}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <Card><CardHeader><CardTitle>Proposed trades</CardTitle></CardHeader><CardContent>
        <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-muted-foreground"><tr><th className="py-2">Security</th><th>Asset class</th><th>Price</th><th>Shares to sell</th><th>Estimated proceeds</th><th /></tr></thead><tbody>
          {orders.map((order, index) => <tr key={order.securityId} className="border-t border-border"><td className="py-3 font-medium">{order.symbol}</td><td>{name(order.assetClass)}</td><td>{money(order.unitPrice)}</td><td><input type="number" min="0" step="0.0001" value={Math.abs(Number(order.signedShares.toFixed(4)))} onChange={(event) => setOrders((current) => current.map((item, row) => row === index ? { ...item, signedShares: -Math.max(Number(event.target.value) || 0, 0) } : item))} className="w-36 rounded-md border border-input bg-background px-2 py-1.5" /></td><td>{money(Math.abs(order.signedShares * order.unitPrice))}</td><td><button type="button" aria-label={`Remove ${order.symbol}`} onClick={() => setOrders((current) => current.filter((_, row) => row !== index))} className="text-red-600"><Trash2 className="h-4 w-4" /></button></td></tr>)}
          {!orders.length && <tr><td colSpan="6" className="py-5 text-muted-foreground">No overweight asset classes require a sell.</td></tr>}
        </tbody></table></div>
      </CardContent></Card>
      <div className="flex justify-end"><Button onClick={submit} disabled={saving || !orders.length} className="gap-2"><Save className="h-4 w-4" />{saving ? 'Applying sells…' : 'Apply sells'}</Button></div>
    </>}
  </div>;
}
