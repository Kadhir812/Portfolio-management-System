import { useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { Notice } from '../components/Notice';
import { Card } from '../components/ui/card';
import { useBenchmarkPerformance } from '../hooks/useBenchmarkPerformance';
import { useDashboardData } from '../hooks/useDashboardData';
import { allocationRows } from '../lib/dashboard';
import { formatAssetClass } from '../lib/assetClassUtils';
import { AllocationCard } from './dashboard/AllocationCard';
import { AllocationTable } from './dashboard/AllocationTable';
import { DashboardHeader } from './dashboard/DashboardHeader';
import { DashboardHoldingsGrid } from './dashboard/DashboardHoldingsGrid';
import { KpiRow } from './dashboard/KpiRow';
import { PerformancePanel } from './dashboard/PerformancePanel';
import { TotalAssetsCard } from './dashboard/TotalAssetsCard';

export function DashboardPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { portfolio, theme, valuation, dates, selectedDate, setSelectedDate, loading, error } =
    useDashboardData(id, searchParams.get('date'));
  const performance = useBenchmarkPerformance({ portfolioId: id, valuation, preferredIndex: portfolio?.benchmark });

  const currency = portfolio?.currency || 'INR';
  const rows = useMemo(() => allocationRows(valuation, portfolio), [valuation, portfolio]);
  const breaches = rows.filter((row) => row.alert);

  if (loading) return <Card className="p-6 text-muted-foreground">Loading dashboard…</Card>;
  if (!portfolio) return <Notice tone="error">{error || 'Portfolio not found.'}</Notice>;

  return (
    <>
      <DashboardHeader
        portfolio={portfolio}
        theme={theme}
        valuation={valuation}
        dates={dates}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />

      <Notice tone="error">{error}</Notice>

      {!portfolio.holdingsSaved && (
        <Notice tone="warning">
          This portfolio has no saved holdings yet.{' '}
          <Link to={`/portfolios/${id}/holdings`} className="font-semibold underline">Add holdings</Link> to see performance.
        </Notice>
      )}
      {portfolio.holdingsSaved && !valuation && !error && <Card className="p-6 text-muted-foreground">Loading prices…</Card>}

      {valuation && (
        <>
          {breaches.length > 0 && (
            <Link
              to={`/portfolios/${id}/rebalance?date=${valuation.requestedDate}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warn/30 bg-warn/10 px-4 py-3 text-sm text-warn transition hover:bg-warn/15"
            >
              <span className="flex items-center gap-2 font-medium">
                <AlertTriangle className="h-4 w-4" />
                Drift is beyond 5 pp in {breaches.map((row) => formatAssetClass(row.assetClass)).join(', ')}.
              </span>
              <span className="font-semibold">Review rebalance</span>
            </Link>
          )}

          <KpiRow valuation={valuation} performance={performance} currency={currency} />

          <div className="grid gap-4 xl:grid-cols-2">
            <TotalAssetsCard valuation={valuation} currency={currency} />
            <AllocationCard rows={rows} theme={theme} />
          </div>

          <AllocationTable rows={rows} currency={currency} asOf={valuation.requestedDate} />
          <DashboardHoldingsGrid holdings={valuation.holdings} valuation={valuation} currency={currency} />
          <PerformancePanel performance={performance} currency={currency} />
        </>
      )}
    </>
  );
}
