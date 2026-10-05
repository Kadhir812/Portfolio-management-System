import { useState } from 'react';
import { ArrowDown, ArrowUp, Info } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { colorFor, distribution, gainPercent } from '../../lib/dashboard';
import { formatAssetClass } from '../../lib/assetClassUtils';
import { formatDate, money, moneyParts, signedMoney, trimPct } from '../../lib/format';
import { cn } from '../../lib/utils';

/**
 * Total portfolio value, the gain since purchase, and where the money sits.
 * Compact: one line per asset class. Hover a bar segment or a row and the matching one lights up.
 */
export function TotalAssetsCard({ valuation, currency }) {
  const [active, setActive] = useState(null);
  const rows = distribution(valuation);
  const { main, decimals } = moneyParts(valuation.totalValue, currency);
  const change = gainPercent(valuation);
  const up = change >= 0;
  const largest = rows[0]?.assetClass;

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        Total assets
        <span title="Market value of all holdings plus uninvested cash on the selected date." className="cursor-help">
          <Info className="h-3.5 w-3.5" aria-hidden />
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <p className="text-3xl font-bold tracking-tight sm:text-4xl">
          {main}
          <span className="text-muted-foreground/60">{decimals}</span>
        </p>
        <div className="flex items-center gap-2.5 pb-1 text-sm">
          <span className={cn(
            'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-semibold',
            up ? 'border-pos/30 bg-pos/15 text-pos' : 'border-neg/30 bg-neg/15 text-neg'
          )}>
            {up ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
            {trimPct(Math.abs(change))}
          </span>
          <span className="font-medium">
            {signedMoney(valuation.totalGain, currency)}
            <span className="font-normal text-muted-foreground"> since {formatDate(valuation.purchaseDate)}</span>
          </span>
        </div>
      </div>

      <div className="mt-4 flex h-2.5 gap-1" onMouseLeave={() => setActive(null)}>
        {rows.map((row) => (
          <div
            key={row.assetClass}
            title={`${formatAssetClass(row.assetClass)} ${trimPct(row.pct)}`}
            onMouseEnter={() => setActive(row.assetClass)}
            className={cn('min-w-[4px] rounded-[3px] transition-opacity', row.assetClass === largest && 'bar-striped')}
            style={{
              flexGrow: row.pct,
              flexBasis: 0,
              backgroundColor: colorFor(row.assetClass),
              opacity: active && active !== row.assetClass ? 0.3 : 1
            }}
          />
        ))}
      </div>

      <ul className="mt-2" onMouseLeave={() => setActive(null)}>
        {rows.map((row) => (
          <li
            key={row.assetClass}
            onMouseEnter={() => setActive(row.assetClass)}
            className={cn(
              'flex items-center gap-3 border-t border-border py-2 text-sm transition-opacity first:border-t-0',
              active && active !== row.assetClass && 'opacity-40'
            )}
          >
            <i className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: colorFor(row.assetClass) }} />
            <span className="font-semibold">{formatAssetClass(row.assetClass)}</span>
            <span className="text-xs text-muted-foreground">{trimPct(row.pct)}</span>
            <span className="ml-auto font-semibold">{money(row.value, currency)}</span>
          </li>
        ))}
        {!rows.length && <li className="py-3 text-sm text-muted-foreground">No holdings on this date.</li>}
      </ul>
    </Card>
  );
}
