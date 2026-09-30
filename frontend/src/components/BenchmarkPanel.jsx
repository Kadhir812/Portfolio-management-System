import { useEffect, useMemo, useState } from 'react';
import { Activity, BarChart3, Database } from 'lucide-react';
import { api } from '../api/client';

const INDEX_LABELS = {
  SP500: 'S&P 500', NIFTY50: 'NIFTY 50', SENSEX: 'BSE Sensex', NASDAQ100: 'Nasdaq 100',
  SMP500: 'S&P 500', NASDAQ: 'Nasdaq Composite', FTSE100: 'FTSE 100', DAX: 'DAX'
};
const canonicalIndex = (value) => value === 'SMP500' ? 'SP500' : value === 'NASDAQ' ? 'NASDAQ100' : value;
const pct = (value) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
const compactMoney = (value, currency) => new Intl.NumberFormat('en-IN', {
  style: 'currency', currency, maximumFractionDigits: 0, notation: 'compact'
}).format(value || 0);
const formatDate = (date) => new Intl.DateTimeFormat('en-IN', { month: 'short', year: 'numeric' }).format(new Date(`${date}T12:00:00`));

function monthlyCloses(rows) {
  const byMonth = new Map();
  rows.forEach((row) => {
    const key = row.date.slice(0, 7);
    const previous = byMonth.get(key);
    if (!previous || previous.date < row.date) byMonth.set(key, row);
  });
  return [...byMonth.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function indexed(values) {
  const first = values[0];
  return values.map((value) => first > 0 ? (value / first) * 100 : 100);
}

function calcMetrics(points) {
  if (points.length < 2) return null;
  const p0 = points[0].portfolio;
  const b0 = points[0].benchmark;
  const portfolioReturns = points.slice(1).map((point, index) => point.portfolio / points[index].portfolio - 1);
  const benchmarkReturns = points.slice(1).map((point, index) => point.benchmark / points[index].benchmark - 1);
  const mean = (items) => items.reduce((sum, value) => sum + value, 0) / items.length;
  const variance = (items) => mean(items.map((value) => (value - mean(items)) ** 2));
  const pMean = mean(portfolioReturns);
  const bMean = mean(benchmarkReturns);
  const covariance = mean(portfolioReturns.map((value, index) => (value - pMean) * (benchmarkReturns[index] - bMean)));
  const trackingError = Math.sqrt(variance(portfolioReturns.map((value, index) => value - benchmarkReturns[index])) * 12) * 100;
  const annualizedReturn = (end, start) => (Math.pow(end / start, 12 / (points.length - 1)) - 1) * 100;
  const maxDrawdown = (values) => {
    let peak = values[0];
    let drawdown = 0;
    values.forEach((value) => { peak = Math.max(peak, value); drawdown = Math.min(drawdown, value / peak - 1); });
    return drawdown * 100;
  };
  const annualVolatility = (returns) => Math.sqrt(variance(returns) * 12) * 100;
  const portfolioVolatility = annualVolatility(portfolioReturns);
  const benchmarkVolatility = annualVolatility(benchmarkReturns);
  const activeReturns = portfolioReturns.map((value, index) => value - benchmarkReturns[index]);
  const activeMean = mean(activeReturns);
  const informationRatio = variance(activeReturns) === 0 ? 0 : activeMean / Math.sqrt(variance(activeReturns)) * Math.sqrt(12);
  const sharpe = portfolioVolatility === 0 ? 0 : (pMean * 12 * 100) / portfolioVolatility;
  return {
    portfolioReturn: (points.at(-1).portfolio / p0 - 1) * 100,
    benchmarkReturn: (points.at(-1).benchmark / b0 - 1) * 100,
    excessReturn: ((points.at(-1).portfolio / p0) - (points.at(-1).benchmark / b0)) * 100,
    portfolioCagr: annualizedReturn(points.at(-1).portfolio, p0),
    benchmarkCagr: annualizedReturn(points.at(-1).benchmark, b0),
    portfolioVolatility, benchmarkVolatility,
    portfolioDrawdown: maxDrawdown(points.map((point) => point.portfolio)),
    benchmarkDrawdown: maxDrawdown(points.map((point) => point.benchmark)),
    beta: variance(benchmarkReturns) === 0 ? 0 : covariance / variance(benchmarkReturns),
    correlation: variance(portfolioReturns) === 0 || variance(benchmarkReturns) === 0 ? 0 : covariance / Math.sqrt(variance(portfolioReturns) * variance(benchmarkReturns)),
    trackingError,
    informationRatio,
    sharpe
  };
}

export function BenchmarkPanel({ portfolioId, purchaseDate, endDate, currency, preferredIndex, availableDates }) {
  const [index, setIndex] = useState(canonicalIndex(preferredIndex || 'NIFTY50'));
  const [indexes, setIndexes] = useState([]);
  const [indexRows, setIndexRows] = useState([]);
  const [portfolioRows, setPortfolioRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    api.benchmarks.indexes()
      .then((rows) => setIndexes(rows.map((item) => item.indexCode)))
      .catch(() => setIndexes(Object.keys(INDEX_LABELS)));
  }, []);

  useEffect(() => {
    if (!portfolioId || !purchaseDate || !endDate || !availableDates?.length) return;
    let active = true;
    setLoading(true);
    setError('');
    const monthEnds = new Map();
    availableDates.filter((date) => date >= purchaseDate && date <= endDate).forEach((date) => {
      const key = date.slice(0, 7);
      if (!monthEnds.has(key) || monthEnds.get(key) < date) monthEnds.set(key, date);
    });
    if (!monthEnds.has(purchaseDate.slice(0, 7))) monthEnds.set(purchaseDate.slice(0, 7), purchaseDate);
    const valuationDates = [...monthEnds.values()].sort().slice(-25);
    Promise.all([
      api.benchmarks.prices(index, purchaseDate, endDate),
      Promise.all(valuationDates.map((date) => api.holdings.valuation(portfolioId, date)))
    ]).then(([comparison, valuations]) => {
      if (!active) return;
      setIndexRows(monthlyCloses((comparison.prices || []).map((price) => ({ date: price.date, close: Number(price.close) }))));
      setPortfolioRows(valuations.map((value) => ({ date: value.effectiveDate, close: Number(value.totalValue) })));
    }).catch((e) => { if (active) setError(e.message || 'Unable to load benchmark history.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [portfolioId, purchaseDate, endDate, availableDates, index]);

  const series = useMemo(() => {
    if (!indexRows.length || !portfolioRows.length) return [];
    const portfolio = new Map(portfolioRows.map((row) => [row.date.slice(0, 7), row]));
    const benchmark = new Map(indexRows.map((row) => [row.date.slice(0, 7), row]));
    const months = [...portfolio.keys()].filter((month) => portfolio.has(month) && benchmark.has(month)).sort();
    const aligned = months.map((month) => ({ month, ...portfolio.get(month), benchmarkClose: benchmark.get(month).close }));
    if (aligned.length < 2) return [];
    const portfolioIndexed = indexed(aligned.map((point) => point.close));
    const benchmarkIndexed = indexed(aligned.map((point) => point.benchmarkClose));
    return aligned.map((point, i) => ({ ...point, portfolioIndexed: portfolioIndexed[i], benchmarkIndexed: benchmarkIndexed[i] }));
  }, [indexRows, portfolioRows]);

  const metrics = useMemo(() => calcMetrics(series), [series]);

  const points = series;
  const chart = useMemo(() => {
    if (!points.length) return null;
    const all = points.flatMap((point) => [point.portfolioIndexed, point.benchmarkIndexed]);
    const min = Math.min(...all, 100);
    const max = Math.max(...all, 100);
    const padding = (max - min || 1) * 0.12;
    const low = min - padding;
    const high = max + padding;
    const x = (i) => 46 + (i / Math.max(1, points.length - 1)) * 704;
    const y = (v) => 250 - ((v - low) / (high - low)) * 205;
    return {
      low, high,
      portfolioPath: points.map((point, i) => `${i ? 'L' : 'M'} ${x(i)} ${y(point.portfolioIndexed)}`).join(' '),
      benchmarkPath: points.map((point, i) => `${i ? 'L' : 'M'} ${x(i)} ${y(point.benchmarkIndexed)}`).join(' '),
      y, x
    };
  }, [points]);

  const indexLabel = INDEX_LABELS[index] || index;
  return <section className="overflow-hidden rounded-[28px] border border-slate-800 bg-slate-900/70">
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 px-5 py-5">
      <div>
        <div className="flex items-center gap-2 text-sky-300"><BarChart3 className="h-4 w-4" /><span className="text-xs font-semibold uppercase tracking-[0.18em]">Performance analysis</span></div>
        <h3 className="mt-1 text-xl font-semibold text-white">Portfolio vs. benchmark</h3>
        <p className="mt-1 text-sm text-slate-400">Monthly performance, rebased to 100 at the start of the period.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300"><span className="text-slate-500">Index</span><select aria-label="Select benchmark index" value={index} onChange={(e) => setIndex(e.target.value)} className="bg-transparent font-medium text-white outline-none">{(indexes.length ? indexes : Object.keys(INDEX_LABELS)).map((item) => <option className="bg-slate-950" key={item} value={item}>{INDEX_LABELS[item] || item}</option>)}</select></label>
      </div>
    </div>
    {error && <div role="alert" className="mx-5 mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>}
    <div className="grid gap-0 xl:grid-cols-[minmax(0,1.65fr)_minmax(290px,0.8fr)]">
      <div className="min-w-0 border-b border-slate-800 p-5 xl:border-b-0 xl:border-r">
        {loading ? <div className="flex h-[300px] items-center justify-center text-sm text-slate-400"><Activity className="mr-2 h-4 w-4 animate-pulse" />Building monthly comparison…</div> : chart ? <>
          <div className="mb-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-300"><span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-sky-400" />Your portfolio</span><span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-violet-400" />{indexLabel}</span><span className="text-slate-500">Indexed value · start = 100</span></div>
          <div className="w-full overflow-x-auto"><svg className="min-w-[580px]" viewBox="0 0 790 300" role="img" aria-label={`Monthly performance chart comparing the portfolio and ${indexLabel}`}>
            {[0, 1, 2, 3, 4].map((step) => {
              const value = chart.high - ((chart.high - chart.low) * step) / 4;
              const y = chart.y(value);
              return <g key={step}><line x1="46" x2="750" y1={y} y2={y} stroke="#263244" strokeDasharray="4 6" /><text x="4" y={y + 4} fill="#64748b" fontSize="11">{value.toFixed(0)}</text></g>;
            })}
            <line x1="46" x2="750" y1={chart.y(100)} y2={chart.y(100)} stroke="#475569" strokeDasharray="3 4" />
            <path d={chart.benchmarkPath} fill="none" stroke="#a78bfa" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
            <path d={chart.portfolioPath} fill="none" stroke="#38bdf8" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />
            {points.map((point, i) => <g key={point.month}><circle cx={chart.x(i)} cy={chart.y(point.portfolioIndexed)} r="3.5" fill="#38bdf8"><title>{formatDate(`${point.month}-01`)} · Portfolio {compactMoney(point.close, currency)} · {point.portfolioIndexed.toFixed(2)}</title></circle><circle cx={chart.x(i)} cy={chart.y(point.benchmarkIndexed)} r="3" fill="#a78bfa"><title>{formatDate(`${point.month}-01`)} · {indexLabel} {point.benchmarkClose.toLocaleString('en-IN')} · {point.benchmarkIndexed.toFixed(2)}</title></circle></g>)}
            {[0, Math.floor((points.length - 1) / 2), points.length - 1].filter((value, i, values) => values.indexOf(value) === i).map((i) => <text key={i} x={chart.x(i)} y="278" textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'} fill="#64748b" fontSize="11">{formatDate(`${points[i].month}-01`)}</text>)}
          </svg></div>
          <p className="mt-2 text-xs leading-5 text-slate-500">The chart compares cumulative performance. Hover a monthly point to see the portfolio value and the index closing level in its own currency.</p>
        </> : <div className="flex min-h-[300px] flex-col items-center justify-center text-center"><Database className="h-8 w-8 text-slate-600" /><p className="mt-3 max-w-md font-medium text-slate-200">Monthly comparison data is not available yet.</p><p className="mt-1 max-w-lg text-sm leading-6 text-slate-400">No historical prices are stored for this index yet. At least two overlapping monthly closes are needed for a comparison.</p></div>}
      </div>
      <div className="p-5">
        <div className="mb-4 flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Benchmark metrics</p><p className="mt-1 text-sm text-slate-300">{indexLabel} · monthly close basis</p></div><span className="rounded-lg bg-slate-800 px-2 py-1 text-[11px] text-slate-400">{series.length || 0} months</span></div>
        {metrics ? <>
          <div className="mb-4 rounded-2xl border border-sky-400/20 bg-sky-400/[0.06] p-4"><p className="text-xs text-slate-400">Excess return over {indexLabel}</p><p className={`mt-1 text-2xl font-bold ${metrics.excessReturn >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>{pct(metrics.excessReturn)}</p><p className="mt-1 text-xs text-slate-500">Portfolio {pct(metrics.portfolioReturn)} · Index {pct(metrics.benchmarkReturn)}</p></div>
          <div className="grid grid-cols-2 gap-2">
            <Metric label="Annualized return" first={metrics.portfolioCagr} second={metrics.benchmarkCagr} />
            <Metric label="Annual volatility" first={metrics.portfolioVolatility} second={metrics.benchmarkVolatility} />
            <Metric label="Max drawdown" first={metrics.portfolioDrawdown} second={metrics.benchmarkDrawdown} />
            <Metric label="Beta / correlation" value={`${metrics.beta.toFixed(2)} / ${metrics.correlation.toFixed(2)}`} />
            <Metric label="Tracking error" value={`${metrics.trackingError.toFixed(2)}%`} />
            <Metric label="Information ratio" value={metrics.informationRatio.toFixed(2)} />
            <Metric label="Sharpe ratio · 0% risk-free" value={metrics.sharpe.toFixed(2)} />
            <Metric label="Monthly data points" value={series.length} />
          </div>
        </> : <p className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm leading-6 text-slate-400">Metrics appear after at least two matching monthly observations are available for your portfolio and this index.</p>}
        <p className="mt-4 text-[11px] leading-5 text-slate-500">Returns and risk metrics use monthly observations. The Sharpe ratio assumes a 0% risk-free rate. Index prices remain in the index’s native currency; performance is normalized for comparison.</p>
      </div>
    </div>
    {series.length > 0 && <div className="border-t border-slate-800 px-5 py-4">
      <details><summary className="cursor-pointer text-sm font-medium text-slate-300">View monthly prices and values</summary><div className="mt-3 max-h-64 overflow-auto"><table className="w-full min-w-[480px] text-left text-xs"><thead className="sticky top-0 bg-slate-900 text-slate-500"><tr><th className="py-2">Month</th><th>Your portfolio ({currency})</th><th className="text-right">{indexLabel} close</th></tr></thead><tbody>{[...series].reverse().map((point) => <tr key={point.month} className="border-t border-slate-800 text-slate-300"><td className="py-2">{formatDate(`${point.month}-01`)}</td><td>{new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(point.close)}</td><td className="text-right">{point.benchmarkClose.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td></tr>)}</tbody></table></div></details>
    </div>}
  </section>;
}

function Metric({ label, first, second, value }) {
  return <div className="rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-3"><p className="text-[11px] leading-4 text-slate-500">{label}</p>{value !== undefined ? <p className="mt-1 text-sm font-semibold text-slate-100">{value}</p> : <p className="mt-1 text-sm font-semibold text-slate-100">{pct(first)}<span className="mx-1 text-slate-600">/</span>{pct(second)}</p>}</div>;
}
