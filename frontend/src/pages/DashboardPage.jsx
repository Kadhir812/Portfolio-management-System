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
import { formatDate, monthDates } from './dashboard/dashboardUtils';

function calculateGainPercentage(valuation) {
  if (!valuation?.totalValue) return 0;

  const totalValue = Number(valuation.totalValue);
  const totalGain = Number(valuation.totalGain);
  const originalInvestment = totalValue - totalGain;

  // Divide the gain by the original investment, then convert the ratio to a percent.
  return (totalGain / originalInvestment) * 100;
}

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
    let isActive = true;
    setPortfolio(null);
    setTheme(null);
    setValuation(null);
    setError('');
    setLoading(true);
    setSelectedDate(dashboardDate || localDateString());
    Promise.all([api.portfolios.get(id), api.themes.get(id).catch(() => null)])
      .then(([portfolioData, themeData]) => {
        if (!isActive) return;

        setPortfolio(portfolioData);
        setTheme(themeData);
      })
      .catch((requestError) => {
        if (isActive) {
          setError(requestError.message || 'Unable to load portfolio');
        }
      })
      .finally(() => {
        if (isActive) {
          setLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [id, dashboardDate]);

  useEffect(() => {
    if (!id || !selectedDate || !portfolio?.holdingsSaved) return;

    let isActive = true;
    api.holdings.valuation(id, selectedDate)
      .then((result) => {
        if (!isActive) return;

        setValuation(result);
        setError('');
      })
      .catch((requestError) => {
        if (isActive) {
          setError(requestError.message || 'Unable to load historical valuation');
        }
      });

    return () => {
      isActive = false;
    };
  }, [id, selectedDate, portfolio?.holdingsSaved]);

  const dates = useMemo(() => {
    const latestAvailableDate = valuation?.availableDates?.at(-1);
    const candidateDates = monthDates(portfolio?.purchaseDate, latestAvailableDate);

    if (!latestAvailableDate) {
      return candidateDates;
    }

    return [...new Set([...candidateDates, latestAvailableDate])].sort();
  }, [portfolio?.purchaseDate, valuation?.availableDates]);

  useEffect(() => {
    const latestAvailableDate = valuation?.availableDates?.at(-1);

    if (latestAvailableDate && selectedDate > latestAvailableDate) {
      setSelectedDate(latestAvailableDate);
    }
  }, [dates, selectedDate]);

  const alerts = valuation?.allocations?.filter((item) => item.alert) || [];
  const currency = portfolio?.currency || 'INR';
  const holdings = valuation?.holdings || [];
  const allocations = valuation?.allocations || [];

  const allocationValues = holdings.reduce((values, holding) => {
    const currentValue = Number(holding.value || 0);
    values[holding.assetClass] = (values[holding.assetClass] || 0) + currentValue;
    return values;
  }, {});

  const investedSecurityValue = holdings.reduce((total, holding) => {
    return total + Number(holding.value || 0);
  }, 0);

  const compositionAllocations = allocations.length ? allocations : theme?.allocations || [];
  const compositionRows = compositionAllocations.map((allocation) => {
    const targetPercentage = Number(allocation.targetPercentage ?? allocation.percentage ?? 0);
    let currentValue = null;

    if (valuation && allocation.assetClass === 'CASH') {
      // Cash is the portfolio value left after subtracting the valued securities.
      currentValue = Math.max(Number(valuation.totalValue) - investedSecurityValue, 0);
    } else if (valuation) {
      currentValue = allocationValues[allocation.assetClass] || 0;
    }

    const portfolioAmount = Number(portfolio?.amount || 0);
    // Convert the allocation percentage to a fraction before applying it to the amount.
    const targetAmount = portfolioAmount * targetPercentage / 100;

    let currentPercentage = null;
    const totalValue = Number(valuation?.totalValue);

    if (currentValue != null && totalValue) {
      // Divide this allocation's value by the portfolio total to get its current percent.
      currentPercentage = currentValue / totalValue * 100;
    }

    return {
      assetClass: allocation.assetClass,
      targetPercentage,
      targetAmount,
      currentValue,
      currentPercentage
    };
  });

  const holdingsWithTargets = getEqualHoldingTargets(
    holdings,
    allocations,
    portfolio?.amount
  );
  const gainPercent = calculateGainPercentage(valuation);

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 text-slate-300">
        Loading dashboard…
      </div>
    );
  }

  if (error && !portfolio) {
    return (
      <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-200">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

      {error && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      {!portfolio?.holdingsSaved && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-amber-100">
          Save your holdings to start viewing historical performance.
        </div>
      )}

      {portfolio?.holdingsSaved && !valuation && !error && (
        <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5 text-slate-300">
          Loading historical prices…
        </div>
      )}

      {valuation && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-slate-100">
            <span>Invested on {formatDate(valuation.purchaseDate)}</span>
            <span>
              Prices through {formatDate(valuation.effectiveDate)} (nearest trading day)
            </span>
          </div>

          <DashboardMetrics
            valuation={valuation}
            alertCount={alerts.length}
            gainPercent={gainPercent}
            currency={currency}
          />

          <BenchmarkPanel
            portfolioId={id}
            purchaseDate={valuation.purchaseDate}
            endDate={valuation.effectiveDate}
            currency={portfolio?.currency || 'INR'}
            preferredIndex={portfolio?.benchmark}
            availableDates={valuation.availableDates}
          />

          <div className="grid gap-5 xl:grid-cols-2">
            <AllocationDriftPanel
              portfolioId={id}
              theme={theme}
              valuation={valuation}
              alerts={alerts}
            />
            <DashboardHoldingsTable
              valuation={valuation}
              holdings={holdingsWithTargets}
              currency={currency}
              formatDate={formatDate}
            />
          </div>
        </>
      )}
    </div>
  );
}
