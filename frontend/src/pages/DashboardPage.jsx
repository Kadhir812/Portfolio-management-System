import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Activity, AlertTriangle, ArrowRightLeft, CalendarDays, TrendingUp, Wallet } from 'lucide-react';
import { api } from '../api/client';
import { Badge } from '../components/Badge';

const money = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(value || 0));
const label = (value) => (value || '').replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (x) => x.toUpperCase());

function monthDates(start, end) {
  if (!start || !end) return [];
  const first = new Date(`${start}T12:00:00`);
  const last = new Date(`${end}T12:00:00`);
  const dates = [];
  for (let offset = 0; offset < 240; offset += 1) {
    const month = new Date(first.getFullYear(), first.getMonth() + offset, 1, 12);
    const day = Math.min(first.getDate(), new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate());
    month.setDate(day);
    if (month > last) break;
    dates.push(`${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
  }
  return dates;
}

export function DashboardPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [portfolio, setPortfolio] = useState(null);
  const [theme, setTheme] = useState(null);
  const [valuation, setValuation] = useState(null);
  const [selectedDate, setSelectedDate] = useState(searchParams.get('date') || new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([api.portfolios.get(id), api.themes.get(id).catch(() => null)])
      .then(([p, t]) => { if (active) { setPortfolio(p); setTheme(t); } })
      .catch((e) => { if (active) setError(e.message || 'Unable to load portfolio'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    if (!id || !selectedDate || !portfolio?.holdingsSaved) return;
    let active = true;
    api.holdings.valuation(id, selectedDate)
      .then((result) => { if (active) { setValuation(result); setError(''); } })
      .catch((e) => { if (active) setError(e.message || 'Unable to load historical valuation'); });
    return () => { active = false; };
  }, [id, selectedDate, portfolio?.holdingsSaved]);

  const dates = useMemo(() => {
    const candidates = monthDates(portfolio?.purchaseDate, valuation?.availableDates?.at(-1));
    const latest = valuation?.availableDates?.at(-1);
    return latest ? [...new Set([...candidates, latest])].sort() : candidates;
  }, [portfolio?.purchaseDate, valuation?.availableDates]);
  useEffect(() => {
    const latest = valuation?.availableDates?.at(-1);
    if (latest && selectedDate > latest) setSelectedDate(latest);
  }, [dates, selectedDate]);

  const alerts = valuation?.allocations?.filter((item) => item.alert) || [];
  const gainPercent = valuation?.totalValue ? (Number(valuation.totalGain) / (Number(valuation.totalValue) - Number(valuation.totalGain))) * 100 : 0;
  const formatDate = (value) => value ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(`${value}T12:00:00`)) : '—';

  if (loading) return <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 text-slate-300">Loading dashboard…</div>;
  if (error && !portfolio) return <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-200">{error}</div>;

  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-xs uppercase tracking-[0.2em] text-brand-100">Historical portfolio</p><h2 className="mt-1 text-3xl font-bold text-white">{portfolio?.name || 'Portfolio'}</h2></div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200">
          <CalendarDays className="h-4 w-4" /><span className="sr-only">View portfolio as of date</span>
          <select value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-transparent text-white outline-none" disabled={!dates.length}>
            {dates.map((date) => <option className="bg-slate-900" value={date} key={date}>{formatDate(date)}</option>)}
          </select>
        </label>
        <Link to={`/portfolios/${id}/holdings`} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 font-medium text-slate-200"><Wallet className="h-4 w-4" />Holdings</Link>
        {valuation && <Link to={`/portfolios/${id}/rebalance?date=${valuation.requestedDate}`} className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 font-semibold text-slate-950"><ArrowRightLeft className="h-4 w-4" />Rebalance</Link>}
      </div>
    </div>

    {error && <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>}
    {!portfolio?.holdingsSaved && <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-amber-100">Save your holdings to start viewing historical performance.</div>}
    {portfolio?.holdingsSaved && !valuation && !error && <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5 text-slate-300">Loading historical prices…</div>}

    {valuation && <>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-slate-300">
        <span>Invested on {formatDate(valuation.purchaseDate)}</span><span>Prices through {formatDate(valuation.effectiveDate)} (nearest trading day)</span>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Metric title="Portfolio value" value={money(valuation.totalValue)} icon={Activity} />
        <Metric title="Gain / loss" value={`${money(valuation.totalGain)} (${Number.isFinite(gainPercent) ? gainPercent.toFixed(2) : '0.00'}%)`} icon={TrendingUp} />
        <Metric title="Asset classes beyond 5% drift" value={alerts.length} icon={AlertTriangle} tone={alerts.length ? 'danger' : 'good'} />
      </div>

      {alerts.length > 0 && <Link to={`/portfolios/${id}/rebalance?date=${valuation.requestedDate}`} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-amber-100">
        <span className="flex items-center gap-2 font-medium"><AlertTriangle className="h-5 w-5" />Allocation drift exceeds 5 percentage points: {alerts.map((a) => label(a.assetClass)).join(', ')}</span><span className="font-semibold">Review rebalance →</span>
      </Link>}

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-[28px] border border-slate-800 bg-slate-900/70 p-5">
          <div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-semibold text-white">Asset class allocation</h3><Badge tone="info">Target: {theme?.label || label(portfolio?.theme)}</Badge></div>
          {!valuation.allocations?.length && <p className="text-sm text-slate-400">Choose an investment theme to calculate target allocation drift.</p>}
          <div className="space-y-4">{valuation.allocations?.map((a) => <div key={a.assetClass}>
            <div className="mb-1 flex justify-between gap-3 text-sm"><span className="text-slate-200">{label(a.assetClass)}</span><span className={a.alert ? 'text-amber-300' : 'text-slate-400'}>{Number(a.currentPercentage).toFixed(1)}% current / {Number(a.targetPercentage).toFixed(1)}% target <strong className="ml-2">{Number(a.driftPercentagePoints) > 0 ? '+' : ''}{Number(a.driftPercentagePoints).toFixed(1)} pp</strong></span></div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-800"><div className={`h-full rounded-full ${a.alert ? 'bg-amber-400' : 'bg-sky-400'}`} style={{ width: `${Math.min(Number(a.currentPercentage), 100)}%` }} /></div>
          </div>)}</div>
        </section>
        <section className="rounded-[28px] border border-slate-800 bg-slate-900/70 p-5">
          <h3 className="mb-4 text-lg font-semibold text-white">Holdings on {formatDate(valuation.requestedDate)}</h3>
          <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-xs uppercase text-slate-500"><tr><th className="py-2">Security</th><th>Shares</th><th>Price</th><th className="text-right">Value</th></tr></thead><tbody>
            {valuation.holdings.map((h) => <tr className="border-t border-slate-800 text-slate-200" key={h.isin}><td className="py-3"><div className="font-medium">{h.symbol || h.securityName}</div><div className="text-xs text-slate-500">{label(h.assetClass)}</div></td><td>{Number(h.shares).toLocaleString('en-IN')}</td><td>{money(h.currentPrice)}</td><td className="text-right">{money(h.value)}</td></tr>)}
            {!valuation.holdings.length && <tr><td colSpan="4" className="py-5 text-slate-400">No holdings were held on this date.</td></tr>}
          </tbody></table></div>
        </section>
      </div>
    </>}
  </div>;
}

function Metric({ title, value, icon: Icon, tone }) {
  return <div className="rounded-[24px] border border-slate-800 bg-slate-900/70 p-5"><div className="flex items-center justify-between"><p className="text-sm text-slate-400">{title}</p><Icon className={`h-4 w-4 ${tone === 'danger' ? 'text-amber-300' : tone === 'good' ? 'text-emerald-300' : 'text-sky-300'}`} /></div><p className="mt-4 text-2xl font-bold text-white">{value}</p></div>;
}
