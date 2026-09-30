import { lazy, Suspense, useMemo } from 'react';
import { RefreshCcw, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

const DataGrid = lazy(() => import('../../components/ui/DataGrid').then((module) => ({ default: module.DataGrid })));
const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const assetLabel = (value) => value === 'STOCKS' ? 'Equity' : (value || '').replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());

export function HoldingsTable({ rows, summary, targetAmount, saving, loading, error, onUpdateShares, onRemove, onRefresh }) {
  const columnDefs = useMemo(() => [
    {
      headerName: 'Asset class',
      field: 'assetClass',
      sortable: true,
      minWidth: 105,
      valueFormatter: ({ value }) => assetLabel(value)
    },
    {
      headerName: 'Security',
      field: 'securityName',
      sortable: true,
      flex: 1,
      minWidth: 170,
      cellRenderer: ({ data }) => (
        <div className="flex h-full flex-col justify-center py-1">
          <span className="font-medium">{data.securityName || data.symbol}</span>
          {data.symbol && data.symbol !== data.securityName ? <span className="text-xs text-muted-foreground">{data.symbol}</span> : null}
        </div>
      )
    },
    {
      headerName: 'Shares',
      field: 'shares',
      editable: () => !saving,
      cellDataType: 'number',
      cellEditor: 'agNumberCellEditor',
      valueParser: ({ newValue, oldValue }) => {
        const parsed = Number(newValue);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : oldValue;
      },
      sortable: true,
      sortingOrder: ['asc', 'desc'],
      minWidth: 90,
      onCellValueChanged: async ({ data, oldValue, newValue, node }) => {
        if (Number(newValue) === Number(oldValue)) return;
        const updated = await onUpdateShares(data.id, Number(newValue));
        if (updated === false) node.setDataValue('shares', oldValue);
      }
    },
    {
      headerName: 'Price',
      field: 'price',
      sortable: true,
      sortingOrder: ['asc', 'desc'],
      minWidth: 112,
      valueFormatter: ({ value }) => money(value)
    },
    {
      headerName: 'Total value',
      field: 'value',
      sortable: true,
      sortingOrder: ['asc', 'desc'],
      minWidth: 115,
      valueFormatter: ({ value }) => money(value)
    },
    {
      headerName: 'Model target',
      sortable: true,
      minWidth: 150,
      valueGetter: ({ data }) => data?.targetAmount,
      cellRenderer: ({ data }) => data?.targetAmount == null ? '—' : (
        <div className="flex h-full flex-col justify-center">
          <span>{money(data.targetAmount)}</span>
          <span className="text-xs text-muted-foreground">{Number(data.targetPercentage).toFixed(2)}% of portfolio</span>
        </div>
      )
    },
    {
      headerName: 'Difference',
      field: 'difference',
      sortable: true,
      minWidth: 120,
      valueFormatter: ({ value }) => value == null ? '—' : `${value > 0 ? '+' : ''}${money(value)}`,
      cellClass: ({ value }) => value > 0 ? 'text-amber-600' : value < 0 ? 'text-sky-600' : 'text-emerald-600'
    },
    {
      headerName: 'Portfolio %',
      valueGetter: ({ data }) => targetAmount > 0 ? Number(data?.value || 0) / targetAmount * 100 : 0,
      sortable: true,
      sortingOrder: ['asc', 'desc'],
      minWidth: 100,
      valueFormatter: ({ value }) => `${Number(value || 0).toFixed(2)}%`
    },
    {
      headerName: 'Action',
      sortable: false,
      filter: false,
      pinned: 'right',
      width: 60,
      minWidth: 60,
      cellRenderer: ({ data }) => (
        <Button
          type="button"
          variant="ghost"
          className="h-8 w-8 p-0 text-red-600 hover:bg-red-500/10 hover:text-red-600"
          onClick={() => onRemove(data.id)}
          disabled={saving}
          aria-label={`Delete ${data.securityName || data.symbol}`}
          title="Delete holding"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )
    }
  ], [onRemove, onUpdateShares, saving, targetAmount]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle>Portfolio allocation</CardTitle>
          <div className="mt-2 flex gap-2">
            <span className="rounded-full border border-border px-2 py-1 text-[10px] uppercase tracking-[0.16em]">Live backend data</span>
            <span className="rounded-full bg-muted px-2 py-1 text-[10px] uppercase tracking-[0.16em]">{summary.holdingCount} holdings</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}
        {!loading && rows.length === 0 ? <p className="mb-4 text-sm text-muted-foreground">No holdings yet. Add an eligible security above.</p> : null}
        <Suspense fallback={<div className="h-64 rounded-lg border border-border bg-muted/30" />}>
          <DataGrid
            rowData={rows}
            columnDefs={columnDefs}
            getRowId={({ data }) => String(data.id)}
            rowSelectionEnabled={false}
            singleClickEdit
            loading={loading}
            rowHeight={58}
            height={Math.max(240, Math.min(480, rows.length * 54 + 56))}
          />
        </Suspense>
        <div className="mt-4 flex justify-end">
          <Button variant="ghost" className="gap-2" onClick={onRefresh} disabled={loading || saving}>
            <RefreshCcw className="h-4 w-4" />
            Refresh data
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}