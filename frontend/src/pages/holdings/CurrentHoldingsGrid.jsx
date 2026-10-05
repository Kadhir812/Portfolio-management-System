import { useMemo } from 'react';
import { Trash2 } from 'lucide-react';
import { GridCard } from '../../components/grid/GridCard';
import {
  SecurityCell, actionsCol, assetClassCol, categoryCol, moneyCol, numCol, sharesCol
} from '../../components/grid/columns';
import { Button } from '../../components/ui/button';
import { pctOfPortfolio, roomFor, sharesFromValue, valueFromPct } from '../../lib/allocation';
import { money, number, pct } from '../../lib/format';
import { RoomCell } from './RoomCell';

/**
 * What the portfolio holds now. Edit shares or the % directly in the grid;
 * a change that would break a theme limit is rejected with a message saying how many shares fit.
 */
export function CurrentHoldingsGrid({ holdings, model, currency, busy, onChangeShares, onRemove, onReject }) {
  const rows = useMemo(() => holdings.map((holding) => {
    const price = Number(holding.price || 0);
    const { room, limitedBy } = roomFor(model, holding);
    return {
      ...holding,
      shares: Number(holding.shares),
      price,
      value: Number(holding.value),
      pctValue: pctOfPortfolio(holding.value, model.amount),
      room,
      limitedBy,
      canAdd: sharesFromValue(room, price)
    };
  }), [holdings, model]);

  const totals = useMemo(() => {
    const value = rows.reduce((sum, row) => sum + row.value, 0);
    return [{ symbol: 'Total', value, pctValue: pctOfPortfolio(value, model.amount) }];
  }, [rows, model.amount]);

  // Set the holding to `newShares`, unless that needs more room than is left.
  const change = (row, newShares) => {
    if (!(newShares > 0) || newShares === row.shares) return;
    if (newShares > row.shares && row.price > 0) {
      const extra = (newShares - row.shares) * row.price;
      if (extra > row.room + 1e-6) {
        onReject(`You can add at most ${number(row.canAdd, 4)} more shares of ${row.symbol} right now. Room left is ${money(row.room, currency)}.`);
        return;
      }
    }
    onChangeShares(row.id, newShares);
  };

  const columns = useMemo(() => [
    { headerName: 'Security', field: 'symbol', filter: 'agTextColumnFilter', cellRenderer: SecurityCell, width: 210 },
    assetClassCol(),
    categoryCol(),
    sharesCol('shares', 'Shares', {
      editable: !busy,
      cellEditor: 'agNumberCellEditor',
      cellEditorParams: { min: 0, precision: 4 },
      cellClass: (params) => (params.node.rowPinned ? '' : 'cell-input'),
      valueSetter: ({ data, newValue }) => { change(data, Number(newValue)); return false; }
    }),
    moneyCol('price', 'Price', currency),
    moneyCol('value', 'Value', currency, { cellClass: 'font-semibold' }),
    numCol('pctValue', '% of portfolio', {
      editable: (params) => !busy && !params.node.rowPinned,
      cellEditor: 'agNumberCellEditor',
      cellEditorParams: { min: 0, precision: 2 },
      headerTooltip: 'Type a percentage. Shares are rounded down to whole shares.',
      valueFormatter: ({ value }) => pct(value),
      cellClass: (params) => (params.node.rowPinned ? '' : 'cell-input'),
      valueSetter: ({ data, newValue }) => {
        const target = sharesFromValue(valueFromPct(Number(newValue), model.amount), data.price);
        change(data, target);
        return false;
      }
    }),
    numCol('room', 'Room left', { minWidth: 190, cellRenderer: (props) => (props.data?.id ? <RoomCell {...props} currency={currency} /> : null) }),
    sharesCol('canAdd', 'Can add', { cellClass: 'font-semibold' }),
    actionsCol(({ data }) => (data?.id ? (
      <Button
        size="icon"
        variant="ghost"
        className="text-neg hover:bg-neg/10 hover:text-neg"
        disabled={busy}
        onClick={() => onRemove(data.id)}
        aria-label={`Remove ${data.symbol}`}
        title="Remove holding"
      >
        <Trash2 />
      </Button>
    ) : null), 80)
  ], [currency, busy, model.amount]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <GridCard
      title="Your holdings"
      subtitle="Edit shares or % in the grid. Changes are saved straight away."
      exportName="portfolio-holdings"
      rowData={rows}
      columnDefs={columns}
      pinnedBottomRowData={totals}
      getRowId={({ data }) => String(data.id)}
      height={Math.min(Math.max(rows.length * 46 + 130, 260), 440)}
      singleClickEdit
      emptyMessage="No holdings yet. Add a security above."
    />
  );
}
