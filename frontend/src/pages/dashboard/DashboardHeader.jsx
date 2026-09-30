import { Link } from 'react-router-dom';
import { ArrowRightLeft, CalendarDays, PieChart, Wallet } from 'lucide-react';

export function DashboardHeader({
  portfolio,
  portfolioId,
  dates,
  selectedDate,
  onDateChange,
  valuation,
  onOpenComposition,
  formatDate
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-600">Historical portfolio</p>
        <h2 className="mt-1 text-3xl font-bold text-slate-900">{portfolio?.name || 'Portfolio'}</h2>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200">
          <CalendarDays className="h-4 w-4" />
          <span className="sr-only">View portfolio as of date</span>
          <select value={selectedDate} onChange={(event) => onDateChange(event.target.value)} className="bg-transparent text-white outline-none" disabled={!dates.length}>
            {dates.map((date) => <option className="bg-slate-900" value={date} key={date}>{formatDate(date)}</option>)}
          </select>
        </label>
        <button type="button" onClick={onOpenComposition} aria-haspopup="dialog" className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 font-medium text-slate-900">
          <PieChart className="h-4 w-4" />Portfolio composition
        </button>
        <Link to={`/portfolios/${portfolioId}/holdings`} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 font-medium text-slate-900">
          <Wallet className="h-4 w-4" />Holdings
        </Link>
        {valuation && <Link to={`/portfolios/${portfolioId}/rebalance?date=${valuation.requestedDate}`} className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 font-semibold text-slate-950">
          <ArrowRightLeft className="h-4 w-4" />Rebalance
        </Link>}
      </div>
    </div>
  );
}