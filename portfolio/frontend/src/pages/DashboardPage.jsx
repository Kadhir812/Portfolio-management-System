import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Activity, ShieldAlert, TrendingUp, RefreshCcw, Bell } from 'lucide-react';
import { api } from '../lib/api';
import { Badge } from '../components/Badge';

const currency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value || 0);

export function DashboardPage() {
  const { id } = useParams();
  const [portfolio, setPortfolio] = useState(null);
  const [theme, setTheme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [portfolioData, themeData] = await Promise.all([
          api.portfolios.get(id),
          api.themes.get(id).catch(() => null)
        ]);
        setPortfolio(portfolioData);
        setTheme(themeData);
      } catch (e) {
        setError(e.message || 'Unable to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (id) load();
  }, [id]);

  const cards = useMemo(() => [
    { label: 'Total asset value', value: currency(portfolio?.amount || 0), icon: Activity, tone: 'info' },
    { label: 'Yearly returns', value: '12.8%', icon: TrendingUp, tone: 'success' },
    { label: 'Risk horizon', value: theme?.investmentHorizon || 'Medium Term', icon: ShieldAlert, tone: 'warning' },
    { label: 'Drift value', value: '2.4%', icon: RefreshCcw, tone: 'danger' }
  ], [portfolio, theme]);

  if (loading) {
    return <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 text-slate-300">Loading dashboard…</div>;
  }

  if (error) {
    return <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-200">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-brand-100">Dashboard</p>
          <h2 className="mt-1 text-3xl font-bold text-white">{portfolio?.name || 'Portfolio'}</h2>
        </div>
        <button type="button" className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-4 py-2.5 font-medium text-slate-950">
          <Bell className="h-4 w-4" />
          Rebalance
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="rounded-[28px] border border-slate-800 bg-slate-900/70 p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">{label}</p>
              <div className={`rounded-xl p-2 ${tone === 'info' ? 'bg-sky-500/15 text-sky-300' : tone === 'success' ? 'bg-emerald-500/15 text-emerald-300' : tone === 'warning' ? 'bg-amber-500/15 text-amber-300' : 'bg-rose-500/15 text-rose-300'}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-5 text-2xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_1.35fr]">
        <div className="rounded-[30px] border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Investment details</h3>
            <Badge tone="success">Allocation</Badge>
          </div>
          <div className="mt-5 space-y-4">
            {theme?.allocations?.map((allocation) => (
              <div key={allocation.assetClass}>
                <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
                  <span>{allocation.assetClass.replace('_', ' ')}</span>
                  <span>{allocation.percentage}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-gradient-to-r from-sky-400 via-brand-500 to-emerald-400" style={{ width: `${allocation.percentage}%` }} />
                </div>
              </div>
            )) || (
              <p className="text-slate-400">No theme allocations available yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-[30px] border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Drift analysis</h3>
            <Badge tone="danger">Overall drift +2.4%</Badge>
          </div>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div className="relative mx-auto flex h-52 w-52 items-center justify-center rounded-full border-[18px] border-slate-800 bg-slate-950/80">
              <div className="absolute inset-7 rounded-full border-[14px] border-emerald-400/70" />
              <div className="absolute inset-14 rounded-full border-[10px] border-sky-500/60" />
              <div className="text-center">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Theme fit</p>
                <p className="mt-2 text-3xl font-bold text-white">92%</p>
              </div>
            </div>

            <div className="space-y-3">
              {['Stocks', 'Bonds', 'ETFs', 'Mutual Funds'].map((label, index) => (
                <div key={label} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">{label}</span>
                    <span className={`font-semibold ${index % 2 === 0 ? 'text-emerald-300' : 'text-amber-300'}`}>
                      {index % 2 === 0 ? '+3.2%' : '-1.4%'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-[30px] border border-slate-800 bg-slate-900/70 p-5">
          <h3 className="mb-4 text-lg font-semibold text-white">Portfolio trend vs benchmark</h3>
          <div className="h-48 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 p-4">
            <svg viewBox="0 0 360 140" className="h-full w-full">
              <path d="M10 90 C60 85, 90 40, 140 65 S220 120, 260 60 S310 20, 350 50" fill="none" stroke="#60a5fa" strokeWidth="3" />
              <path d="M10 100 C60 95, 130 80, 200 70 S290 85, 350 60" fill="none" stroke="#34d399" strokeWidth="3" strokeDasharray="7 8" />
            </svg>
          </div>
        </div>

        <div className="rounded-[30px] border border-slate-800 bg-slate-900/70 p-5">
          <h3 className="mb-4 text-lg font-semibold text-white">Benchmark details</h3>
          <div className="space-y-3 text-sm text-slate-300">
            <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/40 p-3"><span>Benchmark</span><strong>NIFTY50</strong></div>
            <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/40 p-3"><span>Variance</span><strong>+1.8%</strong></div>
            <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/40 p-3"><span>Alpha</span><strong>+2.4%</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
}
