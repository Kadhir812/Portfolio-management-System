import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { api } from '../api/client';
import { GridCard } from '../components/grid/GridCard';
import { SecurityCell, actionsCol, assetClassCol, driftCol, moneyCol, numCol, pctCol, sharesCol } from '../components/grid/columns';
import { Notice } from '../components/Notice';
import { PageHeader } from '../components/PageHeader';
import { StatTile } from '../components/StatTile';
import { Button, buttonVariants } from '../components/ui/button';
import { formatDate, money } from '../lib/format';
import { buildRebalanceOrders, projectRebalance } from '../lib/rebalance';
import { localDateString } from '../lib/utils';

export function RebalancePage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const tradeDate = params.get('date') || localDateString();

  const [valuation, setValuation] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.holdings.valuation(id, tradeDate),
      api.portfolios.get(id),
      api.holdings.eligibleSecurities(id, tradeDate)
    ])
      .then(([v, p, eligible]) => {
        setValuation(v);
        setPortfolio(p);
        setOrders(buildRebalanceOrders(v, eligible));
      })
      .catch((e) => setError(e.message || 'Unable to load rebalance details'))
      .finally(() => setLoading(false));
  }, [id, tradeDate]);

  const currency = portfolio?.currency || 'INR';
  const projection = useMemo(
    () => (valuation ? projectRebalance(valuation, orders, Number(portfolio?.amount || 0)) : null),
    [valuation, orders, portfolio]
  );

  const orderRows = useMemo(() => orders.map((o) => ({
    ...o,
    tradeShares: Math.abs(o.signedShares),
    proceeds: Math.abs(o.signedShares * o.unitPrice)
  })), [orders]);

  const allocationColumns = useMemo(() => [
    assetClassCol(),
    pctCol('targetPct', 'Target'),
    pctCol('currentPct', 'Current'),
    moneyCol('currentValue', 'Current value', currency, { minWidth: 160 }),
    moneyCol('addValue', 'Needed to hit target', currency, { minWidth: 180 }),
    pctCol('projectedPct', 'After rebalance'),
    driftCol('driftNow', 'Drift now'),
    driftCol('driftAfter', 'Drift after')
  ], [currency]);

  const orderColumns = useMemo(() => [
    {
      headerName: 'Security',
      field: 'symbol',
      minWidth: 220,
      cellRenderer: ({ data }) => {
        if (data?.action !== 'BUY') return <SecurityCell data={data} />;
        const options = data.candidates || [];
        return (
          <select
            aria-label={`Choose security for ${data.assetClass}`}
            value={data.securityId}
            className="field h-8 w-full text-xs"
            onChange={(event) => {
              const selected = options.find((option) => String(option.securityId) === event.target.value);
              if (!selected) return;
              const unitPrice = Number(selected.latestPrice);
              setOrders((list) => list.map((order) => {
                if (order.assetClass !== data.assetClass || order.action !== 'BUY') return order;
                const targetValue = Number(order.targetValue || Math.abs(order.signedShares * order.unitPrice));
                return {
                  ...order,
                  securityId: selected.securityId,
                  isin: selected.isin,
                  symbol: selected.symbol,
                  unitPrice,
                  heldShares: 0,
                  signedShares: targetValue / unitPrice
                };
              }));
            }}
          >
            {options.map((option) => (
              <option key={option.securityId} value={option.securityId}>
                {option.symbol} — {option.name}
              </option>
            ))}
          </select>
        );
      }
    },
    assetClassCol(),
    { headerName: 'Action', field: 'action', minWidth: 100 },
    sharesCol('heldShares', 'Held'),
    moneyCol('unitPrice', 'Price', currency),
    sharesCol('tradeShares', 'Shares', {
      editable: true, singleClickEdit: true, cellEditor: 'agNumberCellEditor', cellEditorParams: { min: 0, precision: 4 }, cellClass: 'cell-input',
      valueSetter: ({ data, newValue }) => {
        const entered = Math.max(Number(newValue) || 0, 0);
        const shares = data.action === 'SELL' ? Math.min(entered, data.heldShares) : entered;
        setOrders((list) => list.map((o) => (o.securityId === data.securityId
          ? {
              ...o,
              signedShares: o.action === 'SELL' ? -shares : shares,
              targetValue: o.action === 'BUY' ? shares * o.unitPrice : o.targetValue
            }
          : o)));
        return false;
      }
    }),
    moneyCol('proceeds', 'Trade value', currency),
    actionsCol(({ data }) => (
      <Button size="icon" variant="ghost" className="text-neg hover:bg-neg/10 hover:text-neg" aria-label={`Remove ${data.symbol}`} onClick={() => setOrders((list) => list.filter((o) => o.securityId !== data.securityId))}><Trash2 /></Button>
    ), 80)
  ], [currency]);

  const submit = async () => {
    const trades = orders
      .filter((o) => o.signedShares !== 0)
      .map(({ securityId, isin, signedShares }) => ({ securityId, isin, signedShares }));
    if (!trades.length) { setError('Keep at least one buy or sell order to rebalance.'); return; }
    try {
      setSaving(true);
      setError('');
      await api.holdings.rebalance(id, { tradeDate, trades });
      window.location.assign(`/portfolios/${id}?date=${tradeDate}`);
    } catch (e) {
      setError(e.message || 'Unable to apply rebalance');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-muted-foreground">Loading rebalance proposal…</p>;

  return (
    <>
      <PageHeader
        title="Rebalance"
        description={`Proposed buys and sells to restore theme targets, priced on ${formatDate(tradeDate)}.`}
        back={<Link to={`/portfolios/${id}?date=${tradeDate}`} className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Dashboard</Link>}
      >
        <Link to={`/portfolios/${id}/holdings`} className={buttonVariants({ variant: 'outline' })}>Holdings</Link>
      </PageHeader>

      <Notice tone="error">{error}</Notice>
      {valuation && !valuation.allocations?.length && <Notice tone="warning">Attach a theme to calculate targets before rebalancing.</Notice>}

      {projection && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label="Portfolio value" value={money(projection.projectedTotal, currency)} sub="After proposed rebalance" />
            <StatTile label="Invested" value={money(projection.projectedInvested, currency)} sub="After proposed rebalance" />
            <StatTile label="Cash" value={money(projection.projectedCash, currency)} tone={projection.projectedCash < 0 ? 'neg' : undefined} sub={`${money(projection.cashBefore, currency)} before + proceeds - purchases`} />
            <StatTile label="Sale proceeds" value={money(projection.sellValue, currency)} sub={`${money(projection.purchaseValue, currency)} purchases`} />
          </div>

          <GridCard
            title="Allocation: now, target, after sells"
            exportName="rebalance-allocation"
            searchable={false}
            rowData={projection.allocations}
            columnDefs={allocationColumns}
            getRowId={({ data }) => data.assetClass}
            height={Math.min(projection.allocations.length * 46 + 70, 360)}
          />
          <GridCard
            title="Proposed sell orders"
            subtitle="Buy underweight classes and sell overweight classes. Quantities can be edited before applying."
            exportName="rebalance-orders"
            actions={<Button onClick={submit} disabled={saving || !orders.length}><Save />{saving ? 'Applying…' : 'Apply rebalance'}</Button>}
            rowData={orderRows}
            columnDefs={orderColumns}
            getRowId={({ data }) => String(data.securityId)}
            height={Math.min(Math.max(orderRows.length * 46 + 70, 200), 400)}
            emptyMessage="No overweight asset class needs a sell."
          />
        </>
      )}
    </>
  );
}
