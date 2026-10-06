import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { GridCard } from '../../components/grid/GridCard';
import {
  SecurityCell, actionsCol, assetClassCol, categoryCol, moneyCol, numCol, sharesCol
} from '../../components/grid/columns';
import { Button } from '../../components/ui/button';
import { pctOfPortfolio, roomFor, sharesFromValue, valueFromPct } from '../../lib/allocation';
import { formatAssetClass } from '../../lib/assetClassUtils';
import { money, number, pct } from '../../lib/format';
import { cn } from '../../lib/utils';
import { RoomCell } from './RoomCell';

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : '';
};

/**
 * Securities you can add. Type shares, or type a percentage of the portfolio, and the other fields follow.
 * "Room left" and "Max shares" show what the theme limits allow for that stock right now.
 */
export function AddSecuritiesGrid({ securities, holdings, model, currency, busy, onAdd }) {
  const [drafts, setDrafts] = useState({});          // securityId -> shares typed so far
  const [assetClass, setAssetClass] = useState('ALL');

  const heldBySecurity = useMemo(
    () => Object.fromEntries(holdings.map((holding) => [holding.securityId, holding])),
    [holdings]
  );

  const classes = useMemo(() => [...new Set(securities.map((security) => security.assetClass))], [securities]);

  const rows = useMemo(() => securities
    .filter((security) => assetClass === 'ALL' || security.assetClass === assetClass)
    .map((security) => {
      const price = Number(security.latestPrice || 0);
      const { room, limitedBy } = roomFor(model, security);
      const shares = drafts[security.securityId] ?? '';
      const cost = (Number(shares) || 0) * price;
      return {
        ...security,
        price,
        heldShares: Number(heldBySecurity[security.securityId]?.shares || 0),
        room,
        limitedBy,
        maxShares: sharesFromValue(room, price),
        shares,
        cost,
        pctValue: shares === '' ? '' : pctOfPortfolio(cost, model.amount),
        roomAfter: room - cost,
        over: cost > room + 1e-6
      };
    }), [securities, assetClass, drafts, model, heldBySecurity]);

  const setShares = (securityId, value) => setDrafts((current) => ({ ...current, [securityId]: value }));

  const add = async (row) => {
    if (await onAdd(row, Number(row.shares))) {
      setDrafts(({ [row.securityId]: _added, ...rest }) => rest);
    }
  };

  const columns = useMemo(() => [
    { headerName: 'Security', field: 'symbol', filter: 'agTextColumnFilter', cellRenderer: SecurityCell, width: 200 },
    moneyCol('price', 'Price', currency),
    numCol('room', 'Room left', { minWidth: 200, cellRenderer: (props) => <RoomCell {...props} currency={currency} /> }),
    sharesCol('maxShares', 'Max shares', { cellClass: 'font-semibold' }),
    sharesCol('shares', 'Shares to add', {
      editable: !busy,
      singleClickEdit: true,
      cellEditor: 'agNumberCellEditor',
      cellEditorParams: { min: 0, precision: 4 },
      cellClass: ({ data }) => cn('cell-input', data.over && 'text-neg'),
      valueSetter: ({ data, newValue }) => { setShares(data.securityId, toNumber(newValue)); return false; }
    }),
    numCol('pctValue', '% of portfolio', {
      editable: !busy,
      singleClickEdit: true,
      cellEditor: 'agNumberCellEditor',
      cellEditorParams: { min: 0, precision: 2 },
      headerTooltip: 'Type a percentage. Shares are rounded down to whole shares.',
      valueFormatter: ({ value }) => (value === '' ? '' : pct(value)),
      cellClass: 'cell-input',
      valueSetter: ({ data, newValue }) => {
        const percentage = toNumber(newValue);
        setShares(data.securityId, percentage === '' ? '' : sharesFromValue(valueFromPct(percentage, model.amount), data.price) || '');
        return false;
      }
    }),
    moneyCol('cost', 'Cost', currency, { valueFormatter: ({ data }) => (data.shares === '' ? '' : money(data.cost, currency)) }),
    numCol('roomAfter', 'Room after', {
      valueFormatter: ({ data }) => money(data.roomAfter, currency),
      cellClass: ({ data }) => (data.over ? 'text-neg font-semibold' : 'text-muted-foreground')
    }),
    assetClassCol(),
    categoryCol('equityCategory', 'Category'),
    sharesCol('heldShares', 'Already held'),
    actionsCol(({ data }) => (
      <div className="flex gap-1.5">
        <Button
          size="sm"
          variant="outline"
          disabled={busy || data.maxShares <= 0}
          onClick={() => setShares(data.securityId, data.maxShares)}
          title={`Fill with the most you can add: ${number(data.maxShares, 4)} shares`}
        >
          Max
        </Button>
        <Button size="sm" disabled={busy || !data.shares || data.over} onClick={() => add(data)}>
          <Plus /> Add
        </Button>
      </div>
    ), 170)
  ], [currency, busy, model.amount]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <GridCard
      title="Add securities"
      subtitle="Type shares or a percentage. Room left is what the theme limits still allow for that stock."
      exportName="eligible-securities"
      rowData={rows}
      columnDefs={columns}
      getRowId={({ data }) => String(data.securityId)}
      height={460}
      singleClickEdit
      emptyMessage="No eligible securities have a price on the portfolio date."
      toolbar={classes.length > 1 ? (
        <div className="flex rounded-md border border-input p-0.5" role="group" aria-label="Filter by asset class">
          {['ALL', ...classes].map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setAssetClass(key)}
              aria-pressed={assetClass === key}
              className={cn(
                'rounded px-2.5 py-1 text-xs font-medium transition',
                assetClass === key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {key === 'ALL' ? 'All' : formatAssetClass(key)}
            </button>
          ))}
        </div>
      ) : null}
    />
  );
}
