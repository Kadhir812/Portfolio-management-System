import { useEffect, useState } from 'react';
import { Search, TriangleAlert } from 'lucide-react';
import { api } from '../api/client';
import { Button } from '../components/ui/button';

const requiredFields = [
  { label: 'Stock exchange', value: (security) => security.exchange },
  { label: 'Security symbol', value: (security) => security.symbol },
  { label: 'Security series', value: (security) => security.series },
  { label: 'Security description', value: (security) => security.description },
  { label: 'Security identifier', value: (security) => security.isin || security.cupid || security.securityId },
  { label: 'Country', value: (security) => security.country },
  { label: 'Currency', value: (security) => security.currency }
];

const missingRequiredFields = (security) => requiredFields.filter((field) => {
  const value = field.value(security);
  return value == null || String(value).trim() === '';
});

export function SecuritiesPage() {
  const [searchMode, setSearchMode] = useState('symbol');
  const [symbol, setSymbol] = useState('');
  const [exchange, setExchange] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [security, setSecurity] = useState(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [masterSecurities, setMasterSecurities] = useState([]);
  const [masterLoading, setMasterLoading] = useState(true);
  const [masterError, setMasterError] = useState('');

  const missingFields = security ? missingRequiredFields(security) : [];
  const identifierName = exchange === 'NSE'
    ? 'ISIN'
    : exchange
      ? 'CUPID'
      : 'Security identifier';

  useEffect(() => {
    let active = true;
    api.securities.list()
      .then((records) => { if (active) setMasterSecurities(records); })
      .catch((listError) => { if (active) setMasterError(listError.message || 'Unable to load securities.'); })
      .finally(() => { if (active) setMasterLoading(false); });
    return () => { active = false; };
  }, []);

  const search = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSecurity(null);
    setSearched(true);

    try {
      const query = searchMode === 'symbol'
        ? { symbol: symbol.trim() }
        : {
            exchange: exchange.trim(),
            [exchange === 'NSE' ? 'isin' : 'cupid']: identifier.trim()
          };
      setSecurity(await api.securities.search(query));
    } catch (searchError) {
      setError(searchError.message || 'Unable to search the securities master.');
    } finally {
      setLoading(false);
    }
  };

  const changeSearchMode = (mode) => {
    setSearchMode(mode);
    setSecurity(null);
    setSearched(false);
    setError('');
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Market data</p>
        <h2 className="mt-1 text-3xl font-bold">Securities</h2>
        <p className="mt-2 text-sm text-muted-foreground">Search the securities master by symbol or by exchange and identifier.</p>
      </div>

      <section className="max-w-3xl rounded-lg border border-border bg-card p-5">
        <div className="mb-4 inline-flex rounded-md border border-border bg-muted p-1" aria-label="Security search type">
          <button
            type="button"
            aria-pressed={searchMode === 'symbol'}
            onClick={() => changeSearchMode('symbol')}
            className={`rounded px-3 py-1.5 text-sm font-medium ${searchMode === 'symbol' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
          >
            By symbol
          </button>
          <button
            type="button"
            aria-pressed={searchMode === 'exchangeIdentifier'}
            onClick={() => changeSearchMode('exchangeIdentifier')}
            className={`rounded px-3 py-1.5 text-sm font-medium ${searchMode === 'exchangeIdentifier' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
          >
            By exchange + identifier
          </button>
        </div>

        <form onSubmit={search} className="space-y-4">
          {searchMode === 'symbol' ? (
            <label className="block space-y-1.5 text-sm font-medium">
              Stock symbol
              <input
                required
                value={symbol}
                onChange={(event) => setSymbol(event.target.value)}
                placeholder="AAPL or RELIANCE"
                className="w-full rounded-md border border-input bg-background px-3 py-2 font-normal"
              />
            </label>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1.5 text-sm font-medium">
                Stock exchange
                <select
                  required
                  value={exchange}
                  onChange={(event) => {
                    setExchange(event.target.value);
                    setIdentifier('');
                  }}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 font-normal"
                >
                  <option value="">Choose an exchange</option>
                  <option value="NSE">NSE</option>
                  <option value="LSE">LSE</option>
                </select>
              </label>
              <label className="block space-y-1.5 text-sm font-medium">
                {identifierName}
                <input
                  required
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  placeholder={exchange === 'NSE' ? 'INE009A01021' : 'Enter CUPID'}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 font-normal"
                />
              </label>
            </div>
          )}
          <Button type="submit" className="gap-2" disabled={loading}>
            <Search className="h-4 w-4" />
            {loading ? 'Searching…' : 'Search security'}
          </Button>
        </form>
      </section>

      {error && <div role="alert" className="max-w-3xl rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">{error}</div>}

      {security && <section className="space-y-4 rounded-lg border border-border bg-card p-5">
        <div>
          <h3 className="text-lg font-semibold">{security.symbol || 'Security'}{security.series ? ` · ${security.series}` : ''}</h3>
          {security.name && <p className="mt-1 text-sm text-muted-foreground">{security.name}</p>}
        </div>

        {missingFields.length > 0 && <div role="alert" className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Missing required values: {missingFields.map((field) => field.label).join(', ')}.</span>
        </div>}

        <dl className="grid gap-x-8 sm:grid-cols-2">
          {requiredFields.map((field) => {
            const value = field.value(security);
            const missing = value == null || String(value).trim() === '';
            return (
              <div key={field.label} className="flex min-w-0 items-start justify-between gap-4 border-t border-border py-3">
                <dt className="shrink-0 text-sm text-muted-foreground">{field.label}</dt>
                <dd className={`min-w-0 break-all text-right text-sm font-medium ${missing ? 'text-red-600 dark:text-red-300' : ''}`}>
                  {missing ? 'Missing' : String(value)}
                </dd>
              </div>
            );
          })}
          <div className="flex min-w-0 items-start justify-between gap-4 border-t border-border py-3">
            <dt className="shrink-0 text-sm text-muted-foreground">Database record ID</dt>
            <dd className="min-w-0 break-all text-right text-sm font-medium">{security.securityId ?? '—'}</dd>
          </div>
        </dl>
      </section>}

      {searched && !loading && !security && !error && <p className="text-sm text-muted-foreground">No matching security found.</p>}

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3 className="text-xl font-semibold">Securities master</h3>
            <p className="mt-1 text-sm text-muted-foreground">All securities currently stored in the master.</p>
          </div>
          {!masterLoading && !masterError && <p className="text-sm text-muted-foreground">{masterSecurities.length} records</p>}
        </div>

        {masterError && <div role="alert" className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">{masterError}</div>}
        {masterLoading ? <p className="text-sm text-muted-foreground">Loading securities…</p> : null}

        {!masterLoading && !masterError && <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[1080px] text-left text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-3 py-3 font-medium">Exchange</th>
                <th className="px-3 py-3 font-medium">Symbol</th>
                <th className="px-3 py-3 font-medium">Series</th>
                <th className="px-3 py-3 font-medium">Description</th>
                <th className="px-3 py-3 font-medium">Security identifier</th>
                <th className="px-3 py-3 font-medium">Country</th>
                <th className="px-3 py-3 font-medium">Currency</th>
                <th className="px-3 py-3 font-medium">Data quality</th>
              </tr>
            </thead>
            <tbody>
              {masterSecurities.map((record) => {
                const missing = missingRequiredFields(record);
                return (
                  <tr key={record.securityId} className="border-t border-border align-top">
                    <td className="px-3 py-3">{record.exchange || '—'}</td>
                    <td className="px-3 py-3 font-medium">{record.symbol || '—'}</td>
                    <td className="px-3 py-3">{record.series || '—'}</td>
                    <td className="max-w-sm px-3 py-3">{record.description || '—'}</td>
                    <td className="px-3 py-3">{record.isin || record.cupid || record.securityId || '—'}</td>
                    <td className="px-3 py-3">{record.country || '—'}</td>
                    <td className="px-3 py-3">{record.currency || '—'}</td>
                    <td className="px-3 py-3">
                      {missing.length > 0
                        ? <span className="inline-flex items-center gap-1.5 font-medium text-amber-700 dark:text-amber-300"><TriangleAlert className="h-4 w-4" />Missing {missing.length}</span>
                        : <span className="text-emerald-700 dark:text-emerald-300">Complete</span>}
                    </td>
                  </tr>
                );
              })}
              {!masterSecurities.length && <tr><td colSpan="8" className="px-3 py-8 text-center text-muted-foreground">No securities in the master yet.</td></tr>}
            </tbody>
          </table>
        </div>}
      </section>
    </div>
  );
}