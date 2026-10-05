import { useState } from 'react';
import { Activity, Database } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Notice } from '../../components/Notice';
import { compactMoney, pct, signedPct } from '../../lib/format';

const W = 760;
const H = 280;
const PAD = { left: 44, right: 16, top: 16, bottom: 30 };
const monthLabel = (month) => new Intl.DateTimeFormat('en-IN', { month: 'short', year: '2-digit' }).format(new Date(`${month}-01T12:00:00`));

function Chart({ series }) {
  const [hover, setHover] = useState(null);
  const values = series.flatMap((point) => [point.portfolioIndexed, point.benchmarkIndexed, 100]);
  const low = Math.min(...values);
  const high = Math.max(...values);
  const pad = (high - low || 1) * 0.12;
  const x = (i) => PAD.left + (i / Math.max(series.length - 1, 1)) * (W - PAD.left - PAD.right);
  const y = (v) => PAD.top + (1 - (v - (low - pad)) / (high - low + pad * 2)) * (H - PAD.top - PAD.bottom);
  const path = (key) => series.map((point, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(point[key]).toFixed(1)}`).join(' ');

  const onMove = (event) => {
    const box = event.currentTarget.getBoundingClientRect();
    const fraction = ((event.clientX - box.left) / box.width) * W;
    const i = Math.round(((fraction - PAD.left) / (W - PAD.left - PAD.right)) * (series.length - 1));
    setHover(Math.min(Math.max(i, 0), series.length - 1));
  };

  const ticks = [0, 1, 2, 3, 4].map((step) => low - pad + ((high - low + pad * 2) * step) / 4);
  const labelAt = [0, Math.floor((series.length - 1) / 2), series.length - 1].filter((v, i, all) => all.indexOf(v) === i);
  const shown = hover == null ? null : series[hover];

  return (
    <div>
      <div className="mb-2 flex h-5 flex-wrap items-center gap-x-5 text-xs">
        {shown ? (
          <>
            <span className="text-muted-foreground">{monthLabel(shown.month)}</span>
            <span className="text-primary">Portfolio {shown.portfolioIndexed.toFixed(1)}</span>
            <span className="text-sky-400">Index {shown.benchmarkIndexed.toFixed(1)}</span>
          </>
        ) : <span className="text-muted-foreground">Both lines start at 100. Hover to compare a month.</span>}
      </div>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="min-w-[520px]" role="img" aria-label="Portfolio and benchmark performance, rebased to 100" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
          {ticks.map((tick) => (
            <g key={tick}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(tick)} y2={y(tick)} stroke="hsl(var(--border))" strokeDasharray="3 5" />
              <text x={PAD.left - 8} y={y(tick) + 4} textAnchor="end" fontSize="11" fill="hsl(var(--muted-foreground))">{tick.toFixed(0)}</text>
            </g>
          ))}
          <line x1={PAD.left} x2={W - PAD.right} y1={y(100)} y2={y(100)} stroke="hsl(var(--muted-foreground))" strokeOpacity="0.5" />
          <path d={path('benchmarkIndexed')} fill="none" stroke="#5ab4ff" strokeWidth="2.5" strokeLinejoin="round" />
          <path d={path('portfolioIndexed')} fill="none" stroke="#7c5cff" strokeWidth="3" strokeLinejoin="round" />
          {labelAt.map((i) => (
            <text key={i} x={x(i)} y={H - 8} textAnchor={i === 0 ? 'start' : i === series.length - 1 ? 'end' : 'middle'} fontSize="11" fill="hsl(var(--muted-foreground))">{monthLabel(series[i].month)}</text>
          ))}
          {shown && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={H - PAD.bottom} stroke="hsl(var(--muted-foreground))" strokeOpacity="0.5" />
              <circle cx={x(hover)} cy={y(shown.portfolioIndexed)} r="4.5" fill="#7c5cff" />
              <circle cx={x(hover)} cy={y(shown.benchmarkIndexed)} r="4.5" fill="#5ab4ff" />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}

const Row = ({ label, a, b }) => (
  <tr className="border-t border-border">
    <td className="py-2.5 text-muted-foreground">{label}</td>
    <td className="py-2.5 text-right font-semibold">{a}</td>
    <td className="py-2.5 text-right text-muted-foreground">{b}</td>
  </tr>
);

/** Portfolio vs benchmark chart with a side-by-side metrics table. */
export function PerformancePanel({ performance, currency }) {
  const { index, setIndex, indexCodes, indexLabel, series, metrics, loading, error } = performance;
  const last = series.at(-1);

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <h3 className="text-base font-semibold">Performance vs benchmark</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">Month-end values, rebased to 100 at the start.</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          Benchmark
          <select value={index} onChange={(event) => setIndex(event.target.value)} className="field h-9 w-44" aria-label="Benchmark index">
            {indexCodes.map((code) => <option key={code} value={code}>{code}</option>)}
          </select>
        </label>
      </div>
      <Notice tone="warning" className="m-5 mb-0">{error}</Notice>

      <div className="grid gap-6 p-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,1fr)]">
        <div className="min-w-0">
          {loading ? (
            <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground"><Activity className="mr-2 h-4 w-4 animate-pulse" />Building comparison…</div>
          ) : series.length ? <Chart series={series} /> : (
            <div className="flex h-[280px] flex-col items-center justify-center text-center">
              <Database className="h-8 w-8 text-muted-foreground/50" />
              <p className="mt-3 font-medium">No comparison data yet</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">We need at least two month-ends where both the portfolio and {indexLabel} have prices.</p>
            </div>
          )}
        </div>

        <div>
          <p className="text-sm font-medium">
            {last ? <>Latest value <span className="text-muted-foreground">{compactMoney(last.close, currency)}</span></> : 'Metrics'}
          </p>
          {metrics ? (
            <table className="mt-2 w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground">
                  <th className="pb-1 text-left font-medium" />
                  <th className="pb-1 text-right font-medium">Portfolio</th>
                  <th className="pb-1 text-right font-medium">{indexLabel}</th>
                </tr>
              </thead>
              <tbody>
                <Row label="Return over period" a={signedPct(metrics.portfolioReturn)} b={signedPct(metrics.benchmarkReturn)} />
                <Row label="Annualised return" a={signedPct(metrics.portfolioCagr)} b={signedPct(metrics.benchmarkCagr)} />
                <Row label="Volatility" a={pct(metrics.portfolioVolatility, 1)} b={pct(metrics.benchmarkVolatility, 1)} />
                <Row label="Max drawdown" a={signedPct(metrics.portfolioDrawdown, 1)} b={signedPct(metrics.benchmarkDrawdown, 1)} />
                <Row label="Beta" a={metrics.beta.toFixed(2)} b="1.00" />
                <Row label="Correlation" a={metrics.correlation.toFixed(2)} b="1.00" />
                <Row label="Tracking error" a={pct(metrics.trackingError, 1)} b="—" />
                <Row label="Information ratio" a={metrics.informationRatio.toFixed(2)} b="—" />
              </tbody>
            </table>
          ) : <p className="mt-3 text-sm text-muted-foreground">Metrics appear once two or more months overlap.</p>}
          <p className="mt-3 text-xs text-muted-foreground">Based on monthly observations. Sharpe ratio assumes a 0% risk-free rate.</p>
        </div>
      </div>
    </Card>
  );
}
