import { useMemo } from 'react';
import { GridCard } from '../../components/grid/GridCard';
import { Pill, assetClassCol, driftCol, moneyCol, pctCol } from '../../components/grid/columns';
import { formatDate } from '../../lib/format';

/** Portfolio composition by theme: what the theme says, what the portfolio holds. */
export function AllocationTable({ rows, currency, asOf }) {
  const columns = useMemo(() => [
    assetClassCol('assetClass', 'Asset class'),
    pctCol('targetPct', 'As per theme (%)'),
    moneyCol('initialAmount', 'Initial investment', currency, { minWidth: 160 }),
    pctCol('currentPct', 'Actual allocation (%)', { minWidth: 160 }),
    moneyCol('currentValue', 'Current value', currency, { minWidth: 160 }),
    driftCol('driftPp', 'Drift'),
    {
      headerName: 'Status',
      field: 'alert',
      minWidth: 150,
      filter: false,
      cellRenderer: ({ value }) => <Pill tone={value ? 'bad' : 'good'}>{value ? 'Rebalance needed' : 'Within limit'}</Pill>
    }
  ], [currency]);

  return (
    <GridCard
      title="Composition by theme"
      subtitle={`Theme targets against current values on ${formatDate(asOf)}. Drift beyond 5 pp triggers an alert.`}
      exportName="composition-by-theme"
      rowData={rows}
      columnDefs={columns}
      getRowId={({ data }) => data.assetClass}
      height={Math.min(Math.max(rows.length * 46 + 70, 220), 380)}
      emptyMessage="Attach an investment theme to see target allocations."
    />
  );
}
