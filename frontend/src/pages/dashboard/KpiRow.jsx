import { StatTile } from '../../components/StatTile';
import { annualisedReturn, daysBetween, gainPercent } from '../../lib/dashboard';
import { pct, signedMoney, signedPct } from '../../lib/format';

/** Six small tiles: returns first, then risk, then risk-adjusted. */
export function KpiRow({ valuation, performance, currency }) {
  const { metrics, loading, indexLabel } = performance;
  const totalReturn = gainPercent(valuation);
  const days = daysBetween(valuation.purchaseDate, valuation.effectiveDate);
  const annual = annualisedReturn(totalReturn, days);
  const wait = loading ? 'Loading…' : '—';

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      <StatTile
        label="Total return"
        value={signedPct(totalReturn)}
        tone={totalReturn >= 0 ? 'pos' : 'neg'}
        sub={`${signedMoney(valuation.totalGain, currency)} gain`}
        hint="Gain or loss as a percent of the amount invested, since the purchase date."
      />
      <StatTile
        label="Annualised return"
        value={annual == null ? '—' : signedPct(annual)}
        tone={annual == null ? undefined : annual >= 0 ? 'pos' : 'neg'}
        sub={annual == null ? 'Needs 30+ days of history' : `Over ${days} days`}
        hint="Total return converted to a yearly rate, so portfolios of different ages can be compared."
      />
      <StatTile
        label={`vs ${indexLabel}`}
        value={metrics ? signedPct(metrics.excessReturn) : wait}
        tone={metrics ? (metrics.excessReturn >= 0 ? 'pos' : 'neg') : undefined}
        sub={metrics ? `Index ${signedPct(metrics.benchmarkReturn)}` : 'Benchmark comparison'}
        hint="Portfolio return minus the benchmark's return over the same period."
      />
      <StatTile
        label="Volatility"
        value={metrics ? pct(metrics.portfolioVolatility, 1) : wait}
        sub={metrics ? `Index ${pct(metrics.benchmarkVolatility, 1)} · yearly` : 'Yearly'}
        hint="How much monthly returns swing, scaled to a year. Lower means a smoother ride."
      />
      <StatTile
        label="Max drawdown"
        value={metrics ? signedPct(metrics.portfolioDrawdown, 1) : wait}
        tone={metrics && metrics.portfolioDrawdown < -0.05 ? 'neg' : undefined}
        sub={metrics ? `Index ${signedPct(metrics.benchmarkDrawdown, 1)}` : 'Largest fall from a peak'}
        hint="The biggest drop from a high point to a later low."
      />
      <StatTile
        label="Sharpe ratio"
        value={metrics ? metrics.sharpe.toFixed(2) : wait}
        sub={metrics ? `Beta ${metrics.beta.toFixed(2)}` : 'Return per unit of risk'}
        hint="Yearly return divided by volatility, assuming a 0% risk-free rate. Beta is sensitivity to the benchmark."
      />
    </div>
  );
}
