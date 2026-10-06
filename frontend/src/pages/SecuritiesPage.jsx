import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { api } from '../api/client';
import { GridCard } from '../components/grid/GridCard';
import { Pill, textCol } from '../components/grid/columns';
import { Notice } from '../components/Notice';
import { PageHeader } from '../components/PageHeader';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { formatAssetClass } from '../lib/assetClassUtils';

const isLse = (exchange) => exchange === 'LSE' || exchange === 'LSEG';

const REQUIRED = [
  ['Exchange', (s) => s.exchange], ['Symbol', (s) => s.symbol], ['Series', (s) => s.series],
  ['Description', (s) => s.description], ['Security ID', (s) => s.isin || s.cupid || s.securityId],
  ['Country', (s) => s.country], ['Currency', (s) => s.currency]
];
const missingFields = (s) => REQUIRED.filter(([, get]) => { const v = get(s); return v == null || String(v).trim() === ''; }).map(([name]) => name);

function ExchangeHeader({ displayName, exchanges, selectedExchange, onExchangeChange }) {
  return (
    <div className="flex h-full flex-col justify-center gap-1 px-1">
      <span className="font-semibold">{displayName}</span>
      <select
        aria-label="Filter securities by exchange"
        className="field h-7 min-w-0 px-1 text-xs"
        value={selectedExchange}
        onChange={(event) => {
          onExchangeChange(event.target.value);
          event.currentTarget.blur();
        }}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <option value="">All</option>
        {exchanges.map((exchange) => <option key={exchange} value={exchange}>{exchange}</option>)}
      </select>
    </div>
  );
}

export function SecuritiesPage() {
  const [mode, setMode] = useState('symbol');
  const [symbol, setSymbol] = useState('');
  const [exchange, setExchange] = useState('');
  const [masterExchange, setMasterExchange] = useState('');
  const [masterIsin, setMasterIsin] = useState('');
  const [masterSector, setMasterSector] = useState('');
  const [masterIndustry, setMasterIndustry] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [result, setResult] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [master, setMaster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.securities.list().then(setMaster).catch((e) => setError(e.message || 'Unable to load securities')).finally(() => setLoading(false));
  }, []);

  const exchanges = useMemo(() => [...new Set(master.map((security) => security.exchange).filter(Boolean))].sort(), [master]);
  const sectors = useMemo(() => [...new Set(master.map((security) => security.sector).filter(Boolean))].sort(), [master]);
  const industries = useMemo(() => [...new Set(master
    .filter((security) => !masterSector || security.sector === masterSector)
    .map((security) => security.industry)
    .filter(Boolean))].sort(), [master, masterSector]);
  const filteredMaster = useMemo(() => {
    const exchangeQuery = masterExchange.trim().toLowerCase();
    const isinQuery = masterIsin.trim().toLowerCase();
    return master.filter((security) =>
      (!exchangeQuery || String(security.exchange || '').trim().toLowerCase() === exchangeQuery)
      && (!isinQuery || String(security.isin || '').toLowerCase().includes(isinQuery))
      && (!masterSector || security.sector === masterSector)
      && (!masterIndustry || security.industry === masterIndustry)
    );
  }, [master, masterExchange, masterIsin, masterSector, masterIndustry]);
  const idLabel = isLse(exchange) ? 'CUPID' : 'ISIN';

  const search = async (event) => {
    event.preventDefault();
    setSearching(true); setSearchError(''); setResult(null);
    try {
      const query = mode === 'symbol' ? { symbol: symbol.trim() } : { exchange: exchange.trim(), [isLse(exchange) ? 'cupid' : 'isin']: identifier.trim() };
      setResult(await api.securities.search(query));
    } catch (e) {
      setSearchError(e.message || 'No matching security found.');
    } finally {
      setSearching(false);
    }
  };

  const columns = useMemo(() => [
    textCol('symbol', 'Symbol', { cellClass: 'font-semibold' }),
    {
      field: 'exchange',
      headerName: 'Exchange',
      minWidth: 150,
      sortable: false,
      filter: false,
      headerComponent: ExchangeHeader,
      headerComponentParams: {
        exchanges: ['NSE', 'LSE', 'NASDAQ'],
        selectedExchange: masterExchange,
        onExchangeChange: setMasterExchange
      }
    },
    textCol('series', 'Series', { minWidth: 100 }),
    textCol('description', 'Description', { minWidth: 260, flex: 2 }),
    { headerName: 'Security ID', colId: 'id', minWidth: 170, filter: 'agTextColumnFilter', valueGetter: ({ data }) => data.isin || data.cupid || data.securityId },
    textCol('assetClass', 'Asset class', { minWidth: 130, valueFormatter: ({ value }) => formatAssetClass(value) }),
    textCol('sector', 'Sector', { minWidth: 180 }),
    textCol('industry', 'Industry', { minWidth: 200 }),
    textCol('country', 'Country', { minWidth: 110 }),
    textCol('currency', 'Currency', { minWidth: 110 }),
    {
      headerName: 'Data quality', colId: 'quality', minWidth: 160, filter: 'agTextColumnFilter',
      valueGetter: ({ data }) => { const m = missingFields(data); return m.length ? `Missing ${m.length}` : 'Complete'; },
      tooltipValueGetter: ({ data }) => missingFields(data).join(', ') || 'All required fields present',
      cellRenderer: ({ value }) => <Pill tone={value === 'Complete' ? 'good' : 'warn'}>{value}</Pill>
    }
  ], [masterExchange]);

  const missing = result ? missingFields(result) : [];

  return (
    <>
      <PageHeader title="Securities" description="Look up one security, or scroll the full securities master below." />

      <Card className="p-5">
        <div className="inline-flex rounded-md border border-input p-0.5" role="group" aria-label="Search type">
          {[['symbol', 'By symbol'], ['id', 'By exchange and ID']].map(([key, text]) => (
            <button key={key} type="button" aria-pressed={mode === key} onClick={() => { setMode(key); setResult(null); setSearchError(''); }}
              className={`rounded px-3 py-1.5 text-sm font-medium ${mode === key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>{text}</button>
          ))}
        </div>
        <form onSubmit={search} className="mt-4 flex flex-wrap items-end gap-3">
          {mode === 'symbol' ? (
            <label className="w-64"><span className="field-label">Symbol</span>
              <input required className="field" value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="AAPL or RELIANCE" /></label>
          ) : (
            <>
              <label className="w-48"><span className="field-label">Exchange</span>
                <select required className="field" value={exchange} onChange={(e) => { setExchange(e.target.value); setIdentifier(''); }}>
                  <option value="">Choose…</option>{exchanges.map((x) => <option key={x}>{x}</option>)}
                </select></label>
              <label className="w-64"><span className="field-label">{idLabel}</span>
                <input required className="field" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder={`Enter ${idLabel}`} /></label>
            </>
          )}
          <Button type="submit" disabled={searching}><Search />{searching ? 'Searching…' : 'Search'}</Button>
        </form>
        <Notice tone="error" className="mt-4">{searchError}</Notice>
        {result && (
          <div className="mt-5 border-t border-border pt-4">
            <p className="font-semibold">{result.symbol}{result.series ? ` · ${result.series}` : ''} <span className="font-normal text-muted-foreground">{result.name}</span></p>
            {missing.length > 0 && <Notice tone="warning" className="mt-3">Missing required values: {missing.join(', ')}.</Notice>}
            <dl className="mt-3 grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
              {[...REQUIRED.map(([name, get]) => [name, get(result)]), ['Sector', result.sector], ['Industry', result.industry], ['Asset class', formatAssetClass(result.assetClass)]].map(([name, value]) => (
                <div key={name} className="flex justify-between gap-4 border-t border-border py-2.5 text-sm">
                  <dt className="text-muted-foreground">{name}</dt>
                  <dd className={`break-all text-right font-medium ${value ? '' : 'text-neg'}`}>{value || 'Missing'}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </Card>

      <Notice tone="error">{error}</Notice>
      <GridCard
        title="Securities master"
        subtitle={loading ? 'Loading…' : `Showing ${filteredMaster.length} of ${master.length} securities. Scroll sideways for sector, industry and data quality.`}
        toolbar={(
          <>
            <label className="w-44">
              <span className="sr-only">Filter by ISIN</span>
              <input
                className="field h-9"
                value={masterIsin}
                onChange={(event) => setMasterIsin(event.target.value)}
                placeholder="Filter ISIN"
              />
            </label>
            <label className="w-44">
              <span className="sr-only">Filter by sector</span>
              <select className="field h-9" value={masterSector} onChange={(event) => { setMasterSector(event.target.value); setMasterIndustry(''); }}>
                <option value="">All sectors</option>
                {sectors.map((sector) => <option key={sector} value={sector}>{sector}</option>)}
              </select>
            </label>
            <label className="w-48">
              <span className="sr-only">Filter by industry</span>
              <select className="field h-9" value={masterIndustry} onChange={(event) => setMasterIndustry(event.target.value)}>
                <option value="">All industries</option>
                {industries.map((industry) => <option key={industry} value={industry}>{industry}</option>)}
              </select>
            </label>
            {(masterExchange || masterIsin || masterSector || masterIndustry) && (
              <Button type="button" variant="ghost" size="sm" onClick={() => { setMasterExchange(''); setMasterIsin(''); setMasterSector(''); setMasterIndustry(''); }}>
                Clear filters
              </Button>
            )}
          </>
        )}
        exportName="securities-master"
        rowData={filteredMaster}
        columnDefs={columns}
        loading={loading}
        getRowId={({ data }) => String(data.securityId)}
        height={520}
        headerHeight={64}
        tooltipShowDelay={300}
        emptyMessage={master.length > 0 ? 'No securities match the selected filters.' : 'No securities in the master yet.'}
      />
    </>
  );
}
