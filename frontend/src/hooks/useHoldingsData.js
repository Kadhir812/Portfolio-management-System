import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import { localDateString } from '../lib/utils';

/** Everything the Holdings page needs, plus the add / update / remove / save actions. */
export function useHoldingsData(portfolioId) {
  const [state, setState] = useState({ portfolio: null, theme: null, holdings: [], eligible: [] });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const fetchAll = useCallback(async () => {
    const portfolio = await api.portfolios.get(portfolioId);
    // before holdings are saved we price at the purchase date; afterwards at today's date
    const priceDate = portfolio.holdingsSaved ? localDateString() : portfolio.purchaseDate || localDateString();
    const [holdings, eligible, attachedTheme, themes] = await Promise.all([
      api.holdings.list(portfolioId),
      api.holdings.eligibleSecurities(portfolioId, priceDate),
      api.themes.get(portfolioId).catch(() => null),
      api.themes.list().catch(() => [])
    ]);
    setState({
      portfolio,
      holdings,
      eligible: eligible.filter((security) => security.assetClass !== 'CASH'),
      theme: attachedTheme || themes.find((item) => item.theme === portfolio.theme) || null
    });
  }, [portfolioId]);

  useEffect(() => {
    setLoading(true);
    fetchAll()
      .catch((e) => setError(e.message || 'Unable to load holdings'))
      .finally(() => setLoading(false));
  }, [fetchAll]);

  // run a change, then reload so every number on the page agrees with the server
  const run = async (change, failureMessage) => {
    try {
      setBusy(true);
      setError('');
      await change();
      await fetchAll();
      return true;
    } catch (e) {
      setError(e.message || failureMessage);
      return false;
    } finally {
      setBusy(false);
    }
  };

  return {
    ...state,
    loading,
    busy,
    error,
    setError,
    addHolding: (securityId, shares) => run(() => api.holdings.add(portfolioId, { securityId, shares }), 'Unable to add holding'),
    updateShares: (holdingId, shares) => run(() => api.holdings.update(portfolioId, holdingId, { shares }), 'Unable to update holding'),
    removeHolding: (holdingId) => run(() => api.holdings.remove(portfolioId, holdingId), 'Unable to remove holding'),
    saveHoldings: async () => {
      try {
        setBusy(true);
        setError('');
        await api.holdings.save(portfolioId);
        return true;
      } catch (e) {
        setError(e.message || 'Unable to save holdings');
        return false;
      } finally {
        setBusy(false);
      }
    }
  };
}
