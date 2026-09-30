import { AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/Badge';
import { label } from './dashboardUtils';

export function AllocationDriftPanel({ portfolioId, theme, valuation, alerts }) {
  return (
    <>
      {alerts.length > 0 && <Link to={`/portfolios/${portfolioId}/rebalance?date=${valuation.requestedDate}`} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-amber-950">
        <span className="flex items-center gap-2 font-medium"><AlertTriangle className="h-5 w-5" />Allocation drift exceeds 5 percentage points: {alerts.map((alert) => label(alert.assetClass)).join(', ')}</span>
        <span className="font-semibold">Review rebalance →</span>
      </Link>}

      <section className="rounded-[28px] border border-slate-800 bg-slate-900/70 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Asset class allocation</h3>
          <Badge tone="info">Target: {theme?.label || label(theme?.theme)}</Badge>
        </div>
        {!valuation.allocations?.length && <p className="text-sm text-slate-400">Choose an investment theme to calculate target allocation drift.</p>}
        <div className="space-y-4">
          {valuation.allocations?.map((allocation) => <div key={allocation.assetClass}>
            <div className="mb-1 flex justify-between gap-3 text-sm">
              <span className="text-slate-100">{label(allocation.assetClass)}</span>
              <span className={allocation.alert ? 'text-amber-300' : 'text-slate-200'}>
                {Number(allocation.currentPercentage).toFixed(1)}% current / {Number(allocation.targetPercentage).toFixed(1)}% target
                <strong className="ml-2">{Number(allocation.driftPercentagePoints) > 0 ? '+' : ''}{Number(allocation.driftPercentagePoints).toFixed(1)} pp</strong>
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-800">
              <div className={`h-full rounded-full ${allocation.alert ? 'bg-amber-400' : 'bg-sky-400'}`} style={{ width: `${Math.min(Number(allocation.currentPercentage), 100)}%` }} />
            </div>
          </div>)}
        </div>
      </section>
    </>
  );
}