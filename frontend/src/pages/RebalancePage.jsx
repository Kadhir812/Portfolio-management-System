import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { api } from '../api/client';
import { GridCard } from '../components/grid/GridCard';
import { SecurityCell, actionsCol, assetClassCol, driftCol, moneyCol, numCol, pctCol, sharesCol } from '../components/grid/columns';
import { Notice } from '../components/Notice';
import { PageHeader } from '../components/PageHeader';
import { StatTile } from '../components/StatTile';
import { Button, buttonVariants } from '../components/ui/button';
import { formatDate, money } from '../lib/format';
import { buildSellOrders, projectRebalance } from '../lib/rebalance';
import { localDateString } from '../lib/utils';

export function RebalancePage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const tradeDate = params.get('date') || localDateString();

  const [valuation, setValuation] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.holdings.valuation(id, tradeDate), api.portfolios.get(id)])
      .then(([v, p]) => { setValuation(v); setPortfolio(p); setOrders(buildSellOrders(v)); })
      .catch((e) => setError(e.message || 'Unable to load rebalance details'))
      .finally(() => setLoading(false));
  }, [id, tradeDate]);

  const currency = portfolio?.currency || 'INR';
  const projection = useMemo(
    () => (valuation ? projectRebalance(valuation, orders, Number(portfolio?.amount || 0)) : null),
    [valuation, orders, portfolio]
  );

  const orderRows = useMemo(() => orders.map((o) => ({ ...o, sellShares: Math.abs(o.signedShares), proceeds: Math.abs(o.signedShares * o.unitPrice) })), [orders]);

  const allocationColumns = useMemo(() => [
    assetClassCol(),
    pctCol('targetPct', 'Target'),
    pctCol('currentPct', 'Current'),
    moneyCol('currentValue', 'Current value', currency, { minWidth: 160 }),
    moneyCol('addValue', 'Needed to hit target', currency, { minWidth: 180 }),
    pctCol('projectedPct', 'After sells'),
    driftCol('driftNow', 'Drift now'),
    driftCol('driftAfter', 'Drift after')
  ], [currency]);

  const orderColumns = useMemo(() => [
    { headerName: 'Security', field: 'symbol', cellRenderer: SecurityCell },
    assetClassCol(),
    sharesCol('heldShares', 'Held'),
    moneyCol('unitPrice', 'Price', currency),
    sharesCol('sellShares', 'Shares to sell', {
      editable: true, singleClickEdit: true, cellEditor: 'agNumberCellEditor', cellEditorParams: { min: 0, precision: 4 }, cellClass: 'cell-input',
      valueSetter: ({ data, newValue }) => {
        const shares = Math.min(Math.max(Number(newValue) || 0, 0), data.heldShares);
        setOrders((list) => list.map((o) => (o.securityId === data.securityId ? { ...o, signedShares: -shares } : o)));
        return false;
      }
    }),
    moneyCol('proceeds', 'Proceeds', currency),
    actionsCol(({ data }) => (
      <Button size="icon" variant="ghost" className="text-neg hover:bg-neg/10 hover:text-neg" aria-label={`Remove ${data.symbol}`} onClick={() => setOrders((list) => list.filter((o) => o.securityId !== data.securityId))}><Trash2 /></Button>
    ), 80)
  ], [currency]);

  const submit = async () => {
    const trades = orders.filter((o) => o.signedShares < 0).map(({ securityId, isin, signedShares }) => ({ securityId, isin, signedShares }));
    if (!trades.length) { setError('Keep at least one sell order to rebalance.'); return; }
    try {
      setSaving(true);
      setError('');
      await api.holdings.rebalance(id, { tradeDate, trades });
      navigate(`/portfolios/${id}?date=${tradeDate}`, { replace: true });
    } catch (e) {
      setError(e.message || 'Unable to apply sells');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-muted-foreground">Loading rebalance proposal…</p>;

  return (
    <>
      <PageHeader
        title="Rebalance"
        description={`Proposed sells from overweight asset classes, priced on ${formatDate(tradeDate)}. Add replacement buys from Holdings.`}
        back={<Link to={`/portfolios/${id}?date=${tradeDate}`} className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Dashboard</Link>}
      >
        <Link to={`/portfolios/${id}/holdings`} className={buttonVariants({ variant: 'outline' })}>Holdings</Link>
        <Button onClick={submit} disabled={saving || !orders.length}><Save />{saving ? 'Applying…' : 'Apply sells'}</Button>
      </PageHeader>

      <Notice tone="error">{error}</Notice>
      {valuation && !valuation.allocations?.length && <Notice tone="warning">Attach a theme to calculate targets before rebalancing.</Notice>}

      {projection && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label="Portfolio value" value={money(projection.projectedTotal, currency)} sub="After proposed sells" />
            <StatTile label="Invested" value={money(projection.projectedInvested, currency)} sub="After proposed sells" />
            <StatTile label="Cash" value={money(projection.projectedCash, currency)} tone={projection.projectedCash < 0 ? 'neg' : undefined} sub="Sale proceeds stay as cash" />
            <StatTile label="Sale proceeds" value={money(projection.sellValue, currency)} sub="No fees assumed" />
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
            subtitle="Change the quantity or remove a row. The table above updates as you edit."
            exportName="rebalance-orders"
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
