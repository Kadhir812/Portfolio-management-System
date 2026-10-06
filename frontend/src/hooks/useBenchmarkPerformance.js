import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { alignSeries, calcMetrics, canonicalIndex, INDEX_LABELS, monthlyCloses } from '../lib/performance';

// Valuations are fetched a few at a time so the backend isn't flooded.
async function loadValuations(portfolioId, dates) {
  const results = [];
  for (let offset = 0; offset < dates.length; offset += 4) {
    const batch = await Promise.all(dates.slice(offset, offset + 4).map((date) => api.holdings.valuation(portfolioId, date)));
    results.push(...batch);
  }
  return results;
}

/** Month-by-month portfolio value vs a benchmark index, plus return/risk metrics. */
export function useBenchmarkPerformance({ portfolioId, valuation, preferredIndex }) {
  const [index, setIndex] = useState(canonicalIndex(preferredIndex || 'NIFTY50'));
  const [indexCodes, setIndexCodes] = useState(Object.keys(INDEX_LABELS));
  const [indexRows, setIndexRows] = useState([]);
  const [portfolioRows, setPortfolioRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const purchaseDate = valuation?.purchaseDate;
  const endDate = valuation?.effectiveDate;
  const availableDates = valuation?.availableDates;

  useEffect(() => {
    api.benchmarks.indexes().then((rows) => setIndexCodes(rows.map((row) => row.indexCode))).catch(() => {});
  }, []);

  useEffect(() => {
    if (!portfolioId || !purchaseDate || !endDate || !availableDates?.length) return undefined;
    if (endDate < purchaseDate) {
      setIndexRows([]);
      setPortfolioRows([]);
      setError('No valuation data exists on or after the purchase date.');
      setLoading(false);
      return undefined;
    }

    let active = true;
    setLoading(true);
    setError('');

    // last priced day of each month between purchase and the as-of date
    const monthEnds = new Map();
    availableDates.filter((date) => date >= purchaseDate && date <= endDate).forEach((date) => {
      const key = date.slice(0, 7);
      if (!monthEnds.has(key) || monthEnds.get(key) < date) monthEnds.set(key, date);
    });
    if (!monthEnds.has(purchaseDate.slice(0, 7))) monthEnds.set(purchaseDate.slice(0, 7), purchaseDate);
    const valuationDates = [...monthEnds.values()].sort().slice(-25);

    Promise.all([api.benchmarks.prices(index, purchaseDate, endDate), loadValuations(portfolioId, valuationDates)])
      .then(([comparison, valuations]) => {
        if (!active) return;
        setIndexRows(monthlyCloses((comparison.prices || []).map((price) => ({ date: price.date, close: Number(price.close) }))));
        setPortfolioRows(valuations.map((item) => ({ date: item.effectiveDate, close: Number(item.totalValue) })));
      })
      .catch((e) => active && setError(e.message || 'Unable to load benchmark history.'))
      .finally(() => active && setLoading(false));

    return () => { active = false; };
  }, [portfolioId, purchaseDate, endDate, availableDates, index]);

  const series = useMemo(() => alignSeries(portfolioRows, indexRows), [portfolioRows, indexRows]);
  const metrics = useMemo(
    () => calcMetrics(series.map((point) => ({ portfolio: point.close, benchmark: point.benchmarkClose }))),
    [series]
  );

  return { index, setIndex, indexCodes, indexLabel: INDEX_LABELS[index] || index, series, metrics, loading, error };
}
