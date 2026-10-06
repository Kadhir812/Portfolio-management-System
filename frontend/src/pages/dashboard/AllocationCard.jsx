import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/card';
import { NestedDonut } from '../../components/charts/NestedDonut';
import { colorFor, driftSummary } from '../../lib/dashboard';
import { formatAssetClass } from '../../lib/assetClassUtils';
import { signedPp, trimPct } from '../../lib/format';
import { cn } from '../../lib/utils';

const DRIFT_LIMIT = 5;

/**
 * Nested donut. Outer ring is what the portfolio holds now; inner ring is what the theme says it should hold.
 * The drift value (top right) is the biggest gap between the two.
 */
export function AllocationCard({ rows, theme }) {
  const [active, setActive] = useState(null);
  const drift = driftSummary(rows);
  const tone = drift.alertCount > 0 ? 'text-neg' : drift.max > DRIFT_LIMIT / 2 ? 'text-warn' : 'text-pos';
  const activeRow = rows.find((row) => row.assetClass === active);

  const ring = (pick, suffix) => rows.map((row) => ({
    key: row.assetClass,
    value: pick(row),
    color: colorFor(row.assetClass),
    label: `${formatAssetClass(row.assetClass)} ${suffix} ${trimPct(pick(row))}`
  }));

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold">Allocation vs {theme?.label || 'theme'}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Outer ring: current. Inner ring: theme target.</p>
        </div>
        {rows.length > 0 && (
          <div className="shrink-0 text-right">
            <p className={cn('text-2xl font-bold leading-none tracking-tight', tone)}>
              <span className="mr-1.5 text-xs font-medium text-muted-foreground">Drift</span>{drift.max.toFixed(1)} pp
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{formatAssetClass(drift.maxClass)} · limit {DRIFT_LIMIT} pp</p>
          </div>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No theme is attached, so there is no target to compare with.
          <Link to="/portfolios" className="ml-1 font-medium text-foreground underline">Open portfolios</Link>
        </div>
      ) : (
        <div className="mt-3 grid items-center gap-5 sm:grid-cols-[180px_1fr]">
          <NestedDonut
            className="max-w-[180px]"
            label="Current allocation (outer ring) compared with theme allocation (inner ring)"
            outer={ring((row) => row.currentPct, 'current')}
            inner={ring((row) => row.targetPct, 'target')}
            activeKey={active}
            onActive={setActive}
          >
            {activeRow ? (
              <div className="leading-tight">
                <p className="text-[11px] font-semibold">{formatAssetClass(activeRow.assetClass)}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">Now {trimPct(activeRow.currentPct)}</p>
                <p className="text-[10px] text-muted-foreground">Target {trimPct(activeRow.targetPct)}</p>
              </div>
            ) : (
              <p className="text-[10px] leading-tight text-muted-foreground">Hover a segment</p>
            )}
          </NestedDonut>

          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground">
                <th className="pb-1 text-left font-medium">Asset class</th>
                <th className="pb-1 pl-3 text-right font-medium">Now</th>
                <th className="pb-1 pl-3 text-right font-medium">Target</th>
                <th className="pb-1 pl-3 text-right font-medium">Drift</th>
              </tr>
            </thead>
            <tbody onMouseLeave={() => setActive(null)}>
              {rows.map((row) => (
                <tr
                  key={row.assetClass}
                  onMouseEnter={() => setActive(row.assetClass)}
                  className={cn('border-t border-border transition-opacity', active && active !== row.assetClass && 'opacity-40')}
                >
                  <td className="whitespace-nowrap py-2">
                    <span className="inline-flex items-center gap-2 font-medium">
                      <i className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colorFor(row.assetClass) }} />
                      {formatAssetClass(row.assetClass)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap py-2 pl-3 text-right">{trimPct(row.currentPct)}</td>
                  <td className="whitespace-nowrap py-2 pl-3 text-right text-muted-foreground">{trimPct(row.targetPct)}</td>
                  <td className={cn('whitespace-nowrap py-2 pl-3 text-right font-semibold', row.alert ? 'text-neg' : 'text-muted-foreground')}>{signedPp(row.driftPp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
