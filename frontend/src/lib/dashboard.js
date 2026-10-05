// Dashboard maths: everything the cards, donut and tables need, derived from the valuation response.

// Colours come from the --chart-N tokens in index.css (same hues in both modes; one pale tint is deepened in light mode).
const chart = (n) => `var(--chart-${n})`;
export const ASSET_COLORS = {
  EQUITY: chart(1),
  BONDS: chart(2),
  MUTUAL_FUNDS: chart(3),
  ETFS: chart(4),
  COMMODITIES: chart(5),
  REITS: chart(6),
  CRYPTO: chart(7),
  CASH: chart(8)
};
export const colorFor = (assetClass) => ASSET_COLORS[assetClass] || '#8b8ba3';

/** Gain as a percent of what was originally put in. */
export function gainPercent(valuation) {
  const total = Number(valuation?.totalValue || 0);
  const gain = Number(valuation?.totalGain || 0);
  const cost = total - gain;
  return cost > 0 ? (gain / cost) * 100 : 0;
}

export function daysBetween(from, to) {
  if (!from || !to) return 0;
  return Math.round((new Date(`${to}T12:00:00`) - new Date(`${from}T12:00:00`)) / 86400000);
}

/** Compound annual growth rate from a total return over a number of days. Needs at least a month of history. */
export function annualisedReturn(totalReturnPct, days) {
  if (days < 30) return null;
  return (Math.pow(1 + totalReturnPct / 100, 365 / days) - 1) * 100;
}

/** Where the money is now: holdings grouped by asset class, plus uninvested cash. Largest first. */
export function distribution(valuation) {
  if (!valuation) return [];
  const total = Number(valuation.totalValue || 0);
  const byClass = {};
  let invested = 0;
  (valuation.holdings || []).forEach((holding) => {
    const value = Number(holding.value || 0);
    byClass[holding.assetClass] = (byClass[holding.assetClass] || 0) + value;
    invested += value;
  });
  const cash = Math.max(total - invested, 0);
  // ignore rounding dust so a few paise don't create a "Cash 0%" row
  if (cash > total * 0.0005) byClass.CASH = (byClass.CASH || 0) + cash;

  return Object.entries(byClass)
    .map(([assetClass, value]) => ({ assetClass, value, pct: total > 0 ? (value / total) * 100 : 0 }))
    .sort((a, b) => b.value - a.value);
}

/** One row per theme asset class: target vs current, in % and in money. */
export function allocationRows(valuation, portfolio) {
  if (!valuation?.allocations?.length) return [];
  const valueByClass = Object.fromEntries(distribution(valuation).map((row) => [row.assetClass, row.value]));
  const amount = Number(portfolio?.amount || 0);
  return valuation.allocations.map((allocation) => {
    const targetPct = Number(allocation.targetPercentage);
    return {
      assetClass: allocation.assetClass,
      targetPct,
      initialAmount: (amount * targetPct) / 100,
      currentPct: Number(allocation.currentPercentage),
      currentValue: valueByClass[allocation.assetClass] || 0,
      driftPp: Number(allocation.driftPercentagePoints),
      alert: Boolean(allocation.alert)
    };
  });
}

/**
 * Headline drift. `max` is the largest single-class deviation, the number the backend's 5 pp alert uses.
 * `total` adds every class's deviation together.
 */
export function driftSummary(rows) {
  if (!rows.length) return { max: 0, maxClass: null, total: 0, alertCount: 0 };
  const worst = rows.reduce((best, row) => (Math.abs(row.driftPp) > Math.abs(best.driftPp) ? row : best));
  return {
    max: Math.abs(worst.driftPp),
    maxClass: worst.assetClass,
    total: rows.reduce((sum, row) => sum + Math.abs(row.driftPp), 0),
    alertCount: rows.filter((row) => row.alert).length
  };
}

/** Monthly check-in dates from the purchase date to the latest priced day. */
export function monthDates(start, end) {
  if (!start || !end) return [];
  const first = new Date(`${start}T12:00:00`);
  const last = new Date(`${end}T12:00:00`);
  const dates = [];
  for (let offset = 0; offset < 240; offset += 1) {
    const month = new Date(first.getFullYear(), first.getMonth() + offset, 1, 12);
    const day = Math.min(first.getDate(), new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate());
    month.setDate(day);
    if (month > last) break;
    dates.push(`${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
  }
  return dates;
}
