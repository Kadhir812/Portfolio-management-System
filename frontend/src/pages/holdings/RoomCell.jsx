import { limitLabel } from '../../lib/allocation';
import { formatAssetClass } from '../../lib/assetClassUtils';
import { money, titleCase } from '../../lib/format';
import { cn } from '../../lib/utils';

/** "Room left" cell: the amount, plus which limit is the bottleneck. */
export function RoomCell({ data, currency }) {
  const reason = limitLabel(data.limitedBy, {
    assetClassLabel: formatAssetClass(data.assetClass),
    categoryLabel: titleCase(data.equityCategory)
  });
  return (
    <div className="flex h-full flex-col justify-center leading-tight">
      <span className={cn('font-semibold', data.room <= 0 && 'text-neg')}>{money(data.room, currency)}</span>
      <span className="truncate text-xs text-muted-foreground">{data.room <= 0 ? `${reason} is full` : `Limited by ${reason.toLowerCase()}`}</span>
    </div>
  );
}
