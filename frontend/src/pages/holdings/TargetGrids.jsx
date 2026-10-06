import { useMemo } from 'react';
import { GridCard } from '../../components/grid/GridCard';
import { ProgressCell, assetClassCol, categoryCol, driftCol, moneyCol, pctCol } from '../../components/grid/columns';
import { Card } from '../../components/ui/card';
import { colorFor } from '../../lib/dashboard';

// the same columns serve both grids; only the first column differs
const useColumns = (firstColumn, currency, colorOf) => useMemo(() => [
  firstColumn,
  pctCol('targetPct', 'Target'),
  pctCol('currentPct', 'Current'),
  driftCol('gapPct', 'Gap'),
  moneyCol('targetValue', 'Target amount', currency, { minWidth: 150 }),
  moneyCol('currentValue', 'Invested', currency, { minWidth: 150 }),
  moneyCol('leftValue', 'Left to allocate', currency, { minWidth: 160, cellClass: 'font-semibold' }),
  {
    headerName: 'Used',
    colId: 'used',
    minWidth: 170,
    filter: false,
    valueGetter: ({ data }) => (data.targetValue > 0 ? data.currentValue / data.targetValue : 0),
    cellRenderer: ({ data }) => <ProgressCell value={data.currentValue} max={data.targetValue} color={colorOf(data)} />
  }
], [firstColumn, currency, colorOf]);

const classColumn = assetClassCol('assetClass', 'Asset class');
const categoryColumn = categoryCol('equityCategory', 'Equity category', { minWidth: 150 });
const classColor = (row) => colorFor(row.assetClass);
const categoryColor = () => '#7c5cff';

export function TargetGrids({ model, currency, hasTheme }) {
  const classColumns = useColumns(classColumn, currency, classColor);
  const categoryColumns = useColumns(categoryColumn, currency, categoryColor);

  if (!hasTheme) {
    return <Card className="p-6 text-sm text-muted-foreground">Attach an investment theme to this portfolio to see allocation targets.</Card>;
  }

  return (
    <div className="grid gap-4">
      <GridCard
        title="Asset class targets"
        subtitle="How much of each theme target is filled."
        searchable={false}
        rowData={model.classRows}
        columnDefs={classColumns}
        getRowId={({ data }) => data.assetClass}
        height={Math.min(model.classRows.length * 46 + 70, 300)}
      />
      <GridCard
        title="Equity category targets"
        subtitle="Large, mid and small cap limits within equity."
        searchable={false}
        rowData={model.categoryRows}
        columnDefs={categoryColumns}
        getRowId={({ data }) => data.equityCategory}
        height={Math.min(Math.max(model.categoryRows.length, 3) * 46 + 70, 300)}
        emptyMessage="This theme has no equity category targets."
      />
    </div>
  );
}
