import { Activity, AlertTriangle, TrendingUp } from 'lucide-react';
import { money } from './dashboardUtils';

export function DashboardMetrics({ valuation, alertCount, gainPercent, currency }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Metric title="Portfolio value" value={money(valuation.totalValue, currency)} icon={Activity} />
      <Metric title="Gain / loss" value={`${money(valuation.totalGain, currency)} (${Number.isFinite(gainPercent) ? gainPercent.toFixed(2) : '0.00'}%)`} icon={TrendingUp} />
      <Metric title="Asset classes beyond 5% drift" value={alertCount} icon={AlertTriangle} tone={alertCount ? 'danger' : 'good'} />
    </div>
  );
}

function Metric({ title, value, icon: Icon, tone }) {
  return (
    <div className="rounded-[24px] border border-slate-800 bg-slate-900/70 p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-200">{title}</p>
        <Icon className={`h-4 w-4 ${tone === 'danger' ? 'text-amber-300' : tone === 'good' ? 'text-emerald-300' : 'text-sky-300'}`} />
      </div>
      <p className="mt-4 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}