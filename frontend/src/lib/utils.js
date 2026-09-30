import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getEqualHoldingTargets(holdings = [], allocations = [], portfolioAmount = 0) {
  const countsByClass = holdings.reduce((counts, holding) => {
    counts[holding.assetClass] = (counts[holding.assetClass] || 0) + 1;
    return counts;
  }, {});
  const targetPercentages = new Map(allocations.map((allocation) => [
    allocation.assetClass,
    Number(allocation.targetPercentage ?? allocation.percentage)
  ]));

  return holdings.map((holding) => {
    const classTargetPercentage = targetPercentages.get(holding.assetClass);
    const count = countsByClass[holding.assetClass] || 0;
    const targetPercentage = classTargetPercentage == null || count === 0
      ? null
      : classTargetPercentage / count;
    const targetAmount = targetPercentage == null
      ? null
      : Number(portfolioAmount || 0) * targetPercentage / 100;
    const currentValue = Number(holding.value || 0);

    return {
      ...holding,
      targetPercentage,
      targetAmount,
      currentValue,
      difference: targetAmount == null ? null : currentValue - targetAmount
    };
  });
}
