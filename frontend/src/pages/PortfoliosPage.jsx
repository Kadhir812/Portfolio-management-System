import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LayoutDashboard, Pencil, Plus, Trash2, Wallet } from 'lucide-react';
import { api } from '../api/client';
import { GridCard } from '../components/grid/GridCard';
import { Pill, actionsCol, moneyCol, textCol } from '../components/grid/columns';
import { Notice } from '../components/Notice';
import { PageHeader } from '../components/PageHeader';
import { StatTile } from '../components/StatTile';
import { Button, buttonVariants } from '../components/ui/button';
import { compactMoney, titleCase } from '../lib/format';

const STATUS_TONE = { NEW: 'info', ACTIVE: 'good', CLOSED: 'neutral' };

export function PortfoliosPage() {
  const navigate = useNavigate();
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.portfolios.list()
      .then(setPortfolios)
      .catch((e) => setError(e.message || 'Unable to load portfolios'))
      .finally(() => setLoading(false));
  }, []);

  const remove = async (portfolio) => {
    if (!window.confirm(`Delete "${portfolio.name}"? This cannot be undone.`)) return;
    try {
      await api.portfolios.remove(portfolio.id);
      setPortfolios((list) => list.filter((item) => item.id !== portfolio.id));
    } catch (e) {
      setError(e.message || 'Unable to delete portfolio');
    }
  };

  // Status is edited in the grid itself
  const changeStatus = async ({ data, newValue, oldValue, node }) => {
    if (newValue === oldValue) return;
    try {
      setError('');
      const updated = await api.portfolios.update(data.id, {
        name: data.name, type: data.type, currency: data.currency, benchmark: data.benchmark, exchange: data.exchange,
        rebalanceFrequency: data.rebalanceFrequency, amount: Number(data.amount || 0), purchaseDate: data.purchaseDate, status: newValue
      });
      setPortfolios((list) => list.map((item) => (item.id === updated.id ? updated : item)));
    } catch (e) {
      setError(e.message || 'Unable to update status');
      node.setDataValue('status', oldValue);
    }
  };

  const rows = useMemo(() => portfolios.map((p) => ({ ...p, status: p.status || (p.holdingsSaved ? 'ACTIVE' : 'NEW'), amount: Number(p.amount || 0) })), [portfolios]);
  const columns = useMemo(() => [
    textCol('name', 'Portfolio', { cellClass: 'font-semibold', minWidth: 190 }),
    textCol('status', 'Status', {
      minWidth: 130,
      editable: ({ data }) => data.status !== 'CLOSED',
      singleClickEdit: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: ['NEW', 'ACTIVE', 'CLOSED'] },
      onCellValueChanged: changeStatus,
      cellRenderer: ({ value }) => <Pill tone={STATUS_TONE[value]}>{titleCase(value)}</Pill>
    }),
    textCol('theme', 'Theme', { valueFormatter: ({ value }) => (value ? titleCase(value) : 'Not set'), minWidth: 190 }),
    moneyCol('amount', 'Investment', 'INR'),
    textCol('currency', 'Currency', { minWidth: 100 }),
    textCol('benchmark', 'Benchmark'),
    textCol('exchange', 'Exchange', { minWidth: 100 }),
    textCol('rebalanceFrequency', 'Rebalance', { valueFormatter: ({ value }) => titleCase(value) }),
    textCol('purchaseDate', 'Purchase date'),
    actionsCol(({ data }) => (
      <div className="flex gap-1">
        <Button size="icon" variant="ghost" title="Dashboard" aria-label={`Open ${data.name} dashboard`} onClick={() => navigate(`/portfolios/${data.id}`)}><LayoutDashboard /></Button>
        <Button size="icon" variant="ghost" title="Holdings" aria-label={`Open ${data.name} holdings`} onClick={() => navigate(`/portfolios/${data.id}/holdings`)}><Wallet /></Button>
        <Button size="icon" variant="ghost" title="Edit" aria-label={`Edit ${data.name}`} disabled={data.status === 'CLOSED'} onClick={() => navigate(`/portfolios/${data.id}/edit`)}><Pencil /></Button>
        <Button size="icon" variant="ghost" className="text-neg hover:bg-neg/10 hover:text-neg" title="Delete" aria-label={`Delete ${data.name}`} onClick={() => remove(data)}><Trash2 /></Button>
      </div>
    ), 170)
  ], []); // eslint-disable-line react-hooks/exhaustive-deps

  const active = rows.filter((p) => p.status === 'ACTIVE');
  const invested = rows.reduce((sum, p) => sum + p.amount, 0);

  return (
    <>
      <PageHeader title="Portfolios" description="Every portfolio you manage. Double-check status here, or open one to see its dashboard.">
        <Link to="/portfolios/new" className={buttonVariants()}><Plus /> Create portfolio</Link>
      </PageHeader>
      <Notice tone="error">{error}</Notice>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Portfolios" value={rows.length} />
        <StatTile label="Active" value={active.length} tone={active.length ? 'pos' : undefined} />
        <StatTile label="Not started" value={rows.filter((p) => p.status === 'NEW').length} sub="Waiting for holdings" />
        <StatTile label="Total invested" value={compactMoney(invested)} sub="Across all portfolios" />
      </div>

      <GridCard
        title="All portfolios"
        exportName="portfolios"
        rowData={rows}
        columnDefs={columns}
        loading={loading}
        getRowId={({ data }) => String(data.id)}
        height={Math.min(Math.max(rows.length * 46 + 130, 300), 560)}
        emptyMessage="No portfolios yet. Create one to start tracking allocations."
        onRowDoubleClicked={({ data }) => navigate(`/portfolios/${data.id}`)}
      />
    </>
  );
}
