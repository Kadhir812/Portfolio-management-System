import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { localDateString } from '../lib/utils';
import { monthDates } from '../lib/dashboard';

/** Loads a portfolio, its theme, and its valuation for the chosen "as of" date. */
export function useDashboardData(portfolioId, initialDate) {
  const [portfolio, setPortfolio] = useState(null);
  const [theme, setTheme] = useState(null);
  const [valuation, setValuation] = useState(null);
  const [selectedDate, setSelectedDate] = useState(initialDate || localDateString());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // portfolio + theme: reload whenever the portfolio changes
  useEffect(() => {
    let active = true;
    setPortfolio(null);
    setTheme(null);
    setValuation(null);
    setError('');
    setLoading(true);
    setSelectedDate(initialDate || localDateString());

    Promise.all([api.portfolios.get(portfolioId), api.themes.get(portfolioId).catch(() => null)])
      .then(([portfolioData, themeData]) => {
        if (!active) return;
        setPortfolio(portfolioData);
        setTheme(themeData);
      })
      .catch((e) => active && setError(e.message || 'Unable to load portfolio'))
      .finally(() => active && setLoading(false));

    return () => { active = false; };
  }, [portfolioId, initialDate]);

  // valuation: reload when the date changes
  useEffect(() => {
    if (!selectedDate || !portfolio?.holdingsSaved) return undefined;
    let active = true;
    api.holdings.valuation(portfolioId, selectedDate)
      .then((result) => { if (active) { setValuation(result); setError(''); } })
      .catch((e) => active && setError(e.message || 'Unable to load valuation'));
    return () => { active = false; };
  }, [portfolioId, selectedDate, portfolio?.holdingsSaved]);

  const latestPricedDate = valuation?.availableDates?.at(-1);

  // dates offered in the "as of" picker
  const dates = useMemo(() => {
    const monthly = monthDates(portfolio?.purchaseDate, latestPricedDate);
    return latestPricedDate ? [...new Set([...monthly, latestPricedDate])].sort() : monthly;
  }, [portfolio?.purchaseDate, latestPricedDate]);

  // never sit on a date later than the last day we have prices for
  useEffect(() => {
    if (latestPricedDate && selectedDate > latestPricedDate) setSelectedDate(latestPricedDate);
  }, [latestPricedDate, selectedDate]);

  return { portfolio, theme, valuation, dates, selectedDate, setSelectedDate, loading, error };
}
