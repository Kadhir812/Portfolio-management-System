import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRightLeft, BellRing } from 'lucide-react';
import { api } from '../api/client';
import { Button } from '../components/ui/button';

const label = (value) => (value || '').replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());

export function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unavailableCount, setUnavailableCount] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const portfolios = await api.portfolios.list();
        const savedPortfolios = portfolios.filter((portfolio) => portfolio.holdingsSaved);
        const results = await Promise.allSettled(
          savedPortfolios.map(async (portfolio) => ({
            portfolio,
            valuation: await api.holdings.valuation(portfolio.id)
          }))
        );
        if (!active) return;

        const successful = results.filter((result) => result.status === 'fulfilled').map((result) => result.value);
        setAlerts(successful.flatMap(({ portfolio, valuation }) =>
          (valuation.allocations || []).filter((allocation) => allocation.alert).map((allocation) => ({
            portfolioId: portfolio.id,
            portfolioName: portfolio.name,
            tradeDate: valuation.requestedDate,
            ...allocation
          }))
        ));
        setUnavailableCount(results.length - successful.length);
      } catch (loadError) {
        if (active) setError(loadError.message || 'Unable to load allocation alerts');
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => { active = false; };
  }, []);

  return <div className="mx-auto max-w-5xl space-y-6">
    <div>
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Fund manager</p>
      <h2 className="mt-1 flex items-center gap-2 text-3xl font-bold"><BellRing className="h-7 w-7" />Allocation alerts</h2>
      <p className="mt-2 text-sm text-muted-foreground">Portfolios with asset-class drift greater than 5 percentage points.</p>
    </div>

    {error && <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">{error}</div>}
    {unavailableCount > 0 && <div role="status" className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">Could not check {unavailableCount} saved {unavailableCount === 1 ? 'portfolio' : 'portfolios'}.</div>}

    {loading ? <p className="text-sm text-muted-foreground">Checking portfolio allocations…</p> : !error && alerts.length === 0 && unavailableCount === 0 ? (
      <div className="rounded-md border border-border bg-card px-5 py-8 text-center">
        <p className="font-medium">No allocation drift alerts</p>
        <p className="mt-1 text-sm text-muted-foreground">All checked asset classes are within the 5 percentage-point limit.</p>
      </div>
    ) : alerts.length > 0 ? (
      <div className="divide-y divide-border border-y border-border">
        {alerts.map((alert) => {
          const drift = Number(alert.driftPercentagePoints);
          return <article key={`${alert.portfolioId}-${alert.assetClass}`} className="flex flex-wrap items-center justify-between gap-4 py-4">
            <div className="flex min-w-0 items-start gap-3">
              <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <h3 className="font-semibold">{alert.portfolioName} · {label(alert.assetClass)}</h3>
                <p className="mt-1 text-sm text-muted-foreground">Target {Number(alert.targetPercentage).toFixed(1)}% · Current {Number(alert.currentPercentage).toFixed(1)}%</p>
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">{drift > 0 ? '+' : ''}{drift.toFixed(1)} percentage points</p>
              </div>
            </div>
            <Link to={`/portfolios/${alert.portfolioId}/rebalance?date=${alert.tradeDate}`}>
              <Button variant="secondary" className="gap-2"><ArrowRightLeft className="h-4 w-4" />Review rebalance</Button>
            </Link>
          </article>;
        })}
      </div>
    ) : null}
  </div>;
}