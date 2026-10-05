import { useMemo } from 'react';
import { GridCard } from '../../components/grid/GridCard';
import { SecurityCell, assetClassCol, gainCol, gainPctCol, moneyCol, pctCol, sharesCol } from '../../components/grid/columns';
import { formatDate } from '../../lib/format';

export function DashboardHoldingsGrid({ holdings, valuation, currency }) {
  const total = Number(valuation.totalValue || 0);

  const rows = useMemo(() => holdings.map((holding) => {
    const cost = Number(holding.purchasePrice) * Number(holding.shares);
    return {
      ...holding,
      value: Number(holding.value),
      gain: Number(holding.gain),
      gainPct: cost > 0 ? (Number(holding.gain) / cost) * 100 : 0,
      weight: total > 0 ? (Number(holding.value) / total) * 100 : 0
    };
  }), [holdings, total]);

  const totals = useMemo(() => {
    const value = rows.reduce((sum, row) => sum + row.value, 0);
    const gain = rows.reduce((sum, row) => sum + row.gain, 0);
    const cost = value - gain;
    return [{ symbol: 'Total', value, gain, gainPct: cost > 0 ? (gain / cost) * 100 : 0, weight: total > 0 ? (value / total) * 100 : 0 }];
  }, [rows, total]);

  const columns = useMemo(() => [
    { headerName: 'Security', field: 'symbol', filter: 'agTextColumnFilter', cellRenderer: SecurityCell },
    assetClassCol(),
    sharesCol('shares', 'Shares'),
    moneyCol('purchasePrice', 'Avg cost', currency),
    moneyCol('currentPrice', 'Price', currency),
    moneyCol('value', 'Value', currency),
    gainCol('gain', 'Gain / loss', currency),
    gainPctCol('gainPct', 'Return'),
    pctCol('weight', 'Weight', { valueFormatter: ({ value }) => `${Number(value).toFixed(1)}%` })
  ], [currency]);

  return (
    <GridCard
      title="Holdings"
      subtitle={`Positions priced on ${formatDate(valuation.effectiveDate)}.`}
      exportName="holdings"
      rowData={rows}
      columnDefs={columns}
      pinnedBottomRowData={totals}
      getRowId={({ data }) => String(data.securityId ?? data.isin ?? data.symbol)}
      height={Math.min(Math.max(rows.length * 46 + 130, 240), 460)}
      emptyMessage="No holdings were held on this date."
    />
  );
}
