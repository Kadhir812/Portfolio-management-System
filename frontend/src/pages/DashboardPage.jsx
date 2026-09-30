import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { BenchmarkPanel } from '../components/BenchmarkPanel';
import { getEqualHoldingTargets, localDateString } from '../lib/utils';
import { AllocationDriftPanel } from './dashboard/AllocationDriftPanel';
import { DashboardHeader } from './dashboard/DashboardHeader';
import { DashboardHoldingsTable } from './dashboard/DashboardHoldingsTable';
import { DashboardMetrics } from './dashboard/DashboardMetrics';
import { PortfolioCompositionDialog } from './dashboard/PortfolioCompositionDialog';
import { formatDate, label, monthDates } from './dashboard/dashboardUtils';

export function DashboardPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const dashboardDate = searchParams.get('date');
  const [portfolio, setPortfolio] = useState(null);
  const [theme, setTheme] = useState(null);
  const [valuation, setValuation] = useState(null);
  const [selectedDate, setSelectedDate] = useState(dashboardDate || localDateString());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [compositionOpen, setCompositionOpen] = useState(false);

  useEffect(() => {
    let active = true;
    setPortfolio(null);
    setTheme(null);
    setValuation(null);
    setError('');
    setLoading(true);
    setSelectedDate(dashboardDate || localDateString());
    Promise.all([api.portfolios.get(id), api.themes.get(id).catch(() => null)])
      .then(([p, t]) => { if (active) { setPortfolio(p); setTheme(t); } })
      .catch((e) => { if (active) setError(e.message || 'Unable to load portfolio'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, dashboardDate]);

  useEffect(() => {
    if (!id || !selectedDate || !portfolio?.holdingsSaved) return;
    let active = true;
    api.holdings.valuation(id, selectedDate)
      .then((result) => { if (active) { setValuation(result); setError(''); } })
      .catch((e) => { if (active) setError(e.message || 'Unable to load historical valuation'); });
    return () => { active = false; };
  }, [id, selectedDate, portfolio?.holdingsSaved]);

  const dates = useMemo(() => {
    const candidates = monthDates(portfolio?.purchaseDate, valuation?.availableDates?.at(-1));
    const latest = valuation?.availableDates?.at(-1);
    return latest ? [...new Set([...candidates, latest])].sort() : candidates;
  }, [portfolio?.purchaseDate, valuation?.availableDates]);
  useEffect(() => {
    const latest = valuation?.availableDates?.at(-1);
    if (latest && selectedDate > latest) setSelectedDate(latest);
  }, [dates, selectedDate]);

  const alerts = valuation?.allocations?.filter((item) => item.alert) || [];
  const currency = portfolio?.currency || 'INR';
  const allocationValues = (valuation?.holdings || []).reduce((values, holding) => {
    values[holding.assetClass] = (values[holding.assetClass] || 0) + Number(holding.value || 0);
    return values;
  }, {});
  const investedSecurityValue = (valuation?.holdings || []).reduce((total, holding) => total + Number(holding.value || 0), 0);
  const compositionAllocations = valuation?.allocations?.length ? valuation.allocations : theme?.allocations || [];
  const compositionRows = compositionAllocations.map((allocation) => {
    const targetPercentage = Number(allocation.targetPercentage ?? allocation.percentage ?? 0);
    const currentValue = !valuation
      ? null
      : allocation.assetClass === 'CASH'
        ? Math.max(Number(valuation.totalValue) - investedSecurityValue, 0)
        : allocationValues[allocation.assetClass] || 0;
    return {
      assetClass: allocation.assetClass,
      targetPercentage,
      targetAmount: Number(portfolio?.amount || 0) * targetPercentage / 100,
      currentValue,
      currentPercentage: currentValue == null || !Number(valuation?.totalValue)
        ? null
        : currentValue / Number(valuation.totalValue) * 100
    };
  });
  const holdingsWithTargets = getEqualHoldingTargets(
    valuation?.holdings || [],
    valuation?.allocations || [],
    portfolio?.amount
  );
  const gainPercent = valuation?.totalValue ? (Number(valuation.totalGain) / (Number(valuation.totalValue) - Number(valuation.totalGain))) * 100 : 0;

  if (loading) return <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 text-slate-300">Loading dashboard…</div>;
  if (error && !portfolio) return <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-200">{error}</div>;

  return <div className="space-y-6">
    <DashboardHeader
      portfolio={portfolio}
      portfolioId={id}
      dates={dates}
      selectedDate={selectedDate}
      onDateChange={setSelectedDate}
      valuation={valuation}
      onOpenComposition={() => setCompositionOpen(true)}
      formatDate={formatDate}
    />
    <PortfolioCompositionDialog
      open={compositionOpen}
      onClose={() => setCompositionOpen(false)}
      portfolio={portfolio}
      theme={theme}
      valuation={valuation}
      rows={compositionRows}
      currency={currency}
    />

    {error && <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>}
    {!portfolio?.holdingsSaved && <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-amber-100">Save your holdings to start viewing historical performance.</div>}
    {portfolio?.holdingsSaved && !valuation && !error && <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5 text-slate-300">Loading historical prices…</div>}

    {valuation && <>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-slate-100">
        <span>Invested on {formatDate(valuation.purchaseDate)}</span><span>Prices through {formatDate(valuation.effectiveDate)} (nearest trading day)</span>
      </div>
      <DashboardMetrics valuation={valuation} alertCount={alerts.length} gainPercent={gainPercent} currency={currency} />

      <BenchmarkPanel
        portfolioId={id}
        purchaseDate={valuation.purchaseDate}
        endDate={valuation.effectiveDate}
        currency={portfolio?.currency || 'INR'}
        preferredIndex={portfolio?.benchmark}
        availableDates={valuation.availableDates}
      />

      <div className="grid gap-5 xl:grid-cols-2">
        <AllocationDriftPanel portfolioId={id} theme={theme} valuation={valuation} alerts={alerts} />
        <DashboardHoldingsTable valuation={valuation} holdings={holdingsWithTargets} currency={currency} formatDate={formatDate} />
      </div>
    </>}
  </div>;
}
