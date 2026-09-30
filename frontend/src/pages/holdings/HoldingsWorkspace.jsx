import { AddSecurityForm } from './AddSecurityForm';
import { AllocationSummary } from './AllocationSummary';
import { HoldingMetrics } from './HoldingMetrics';
import { HoldingsTable } from './HoldingsTable';

export function HoldingsWorkspace({
  error,
  summary,
  portfolio,
  hasTheme,
  targetAmount,
  addSecurityProps,
  allocationSummary,
  allocationMatches,
  formatAssetClass,
  holdingsTableProps
}) {
  return (
    <>
      {error && <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">{error}</div>}

      <HoldingMetrics summary={summary} portfolio={portfolio} />
      <AddSecurityForm {...addSecurityProps} />

      {hasTheme && (
        <AllocationSummary
          targetAmount={targetAmount}
          allocationSummary={allocationSummary}
          allocationMatches={allocationMatches}
          formatAssetClass={formatAssetClass}
        />
      )}

      <HoldingsTable {...holdingsTableProps} />
    </>
  );
}