// Benchmark comparison maths (moved out of the old BenchmarkPanel so the KPI tiles and the chart share it).

export const INDEX_LABELS = {
  SP500: 'S&P 500', NIFTY50: 'NIFTY 50', SENSEX: 'BSE Sensex', NASDAQ100: 'Nasdaq 100',
  SMP500: 'S&P 500', NASDAQ: 'Nasdaq Composite', FTSE100: 'FTSE 100', DAX: 'DAX'
};

export const canonicalIndex = (value) => (value === 'SMP500' ? 'SP500' : value === 'NASDAQ' ? 'NASDAQ100' : value);

/** Keep only the last price of each calendar month. */
export function monthlyCloses(rows) {
  const byMonth = new Map();
  rows.forEach((row) => {
    const key = row.date.slice(0, 7);
    const previous = byMonth.get(key);
    if (!previous || previous.date < row.date) byMonth.set(key, row);
  });
  return [...byMonth.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/** Rebases a series so the first value is 100. */
export const indexed = (values) => values.map((value) => (values[0] > 0 ? (value / values[0]) * 100 : 100));

/** Joins portfolio and index month by month and adds the rebased (start = 100) values. */
export function alignSeries(portfolioRows, indexRows) {
  const portfolio = new Map(portfolioRows.map((row) => [row.date.slice(0, 7), row]));
  const benchmark = new Map(indexRows.map((row) => [row.date.slice(0, 7), row]));
  const months = [...portfolio.keys()].filter((month) => benchmark.has(month)).sort();
  const aligned = months.map((month) => ({ month, ...portfolio.get(month), benchmarkClose: benchmark.get(month).close }));
  if (aligned.length < 2) return [];
  const p = indexed(aligned.map((point) => point.close));
  const b = indexed(aligned.map((point) => point.benchmarkClose));
  return aligned.map((point, i) => ({ ...point, portfolioIndexed: p[i], benchmarkIndexed: b[i] }));
}

const mean = (items) => items.reduce((sum, value) => sum + value, 0) / items.length;
const variance = (items) => mean(items.map((value) => (value - mean(items)) ** 2));

/** Return and risk metrics from monthly observations: [{ portfolio, benchmark }, ...] */
export function calcMetrics(points) {
  if (points.length < 3) return null; // need at least two monthly returns for volatility

  const first = points[0];
  const last = points.at(-1);
  const portfolioReturns = points.slice(1).map((point, i) => point.portfolio / points[i].portfolio - 1);
  const benchmarkReturns = points.slice(1).map((point, i) => point.benchmark / points[i].benchmark - 1);
  const activeReturns = portfolioReturns.map((value, i) => value - benchmarkReturns[i]);

  const pMean = mean(portfolioReturns);
  const bMean = mean(benchmarkReturns);
  const covariance = mean(portfolioReturns.map((value, i) => (value - pMean) * (benchmarkReturns[i] - bMean)));
  const pVar = variance(portfolioReturns);
  const bVar = variance(benchmarkReturns);

  const annualVolatility = (returns) => Math.sqrt(variance(returns) * 12) * 100;
  const annualisedReturn = (end, start) => (Math.pow(end / start, 12 / (points.length - 1)) - 1) * 100;
  const maxDrawdown = (values) => {
    let peak = values[0];
    let worst = 0;
    values.forEach((value) => { peak = Math.max(peak, value); worst = Math.min(worst, value / peak - 1); });
    return worst * 100;
  };

  const portfolioVolatility = annualVolatility(portfolioReturns);
  const portfolioReturn = (last.portfolio / first.portfolio - 1) * 100;
  const benchmarkReturn = (last.benchmark / first.benchmark - 1) * 100;

  return {
    portfolioReturn,
    benchmarkReturn,
    excessReturn: portfolioReturn - benchmarkReturn,
    portfolioCagr: annualisedReturn(last.portfolio, first.portfolio),
    benchmarkCagr: annualisedReturn(last.benchmark, first.benchmark),
    portfolioVolatility,
    benchmarkVolatility: annualVolatility(benchmarkReturns),
    portfolioDrawdown: maxDrawdown(points.map((point) => point.portfolio)),
    benchmarkDrawdown: maxDrawdown(points.map((point) => point.benchmark)),
    beta: bVar === 0 ? 0 : covariance / bVar,
    correlation: pVar === 0 || bVar === 0 ? 0 : covariance / Math.sqrt(pVar * bVar),
    trackingError: Math.sqrt(variance(activeReturns) * 12) * 100,
    informationRatio: variance(activeReturns) === 0 ? 0 : (mean(activeReturns) / Math.sqrt(variance(activeReturns))) * Math.sqrt(12),
    sharpe: portfolioVolatility === 0 ? 0 : (pMean * 12 * 100) / portfolioVolatility
  };
}
