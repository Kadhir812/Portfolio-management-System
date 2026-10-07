import { CalendarDays } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { Badge } from '../../components/ui/badge';
import { formatDate, money, titleCase } from '../../lib/format';

const STATUS_VARIANT = { NEW: 'info', ACTIVE: 'success', CLOSED: 'default' };

export function DashboardHeader({ portfolio, theme, valuation, dates, selectedDate, onDateChange }) {
  const status = portfolio?.status || 'NEW';
  return (
    <PageHeader
      title={portfolio?.name || 'Portfolio'}
      description={valuation
        ? `Invested ${money(portfolio?.amount, portfolio?.currency)} on ${formatDate(valuation.purchaseDate)}. Prices through ${formatDate(valuation.effectiveDate)}.`
        : undefined}
      back={(
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge variant={STATUS_VARIANT[status]}>{titleCase(status)}</Badge>
          {theme?.label && <Badge variant="outline">{theme.label}</Badge>}
          <Badge variant="outline">Benchmark {portfolio?.benchmark}</Badge>
        </div>
      )}
    >
      <label className="relative">
        <span className="sr-only">View portfolio as of</span>
        <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <select
          value={selectedDate}
          onChange={(event) => onDateChange(event.target.value)}
          disabled={!dates.length}
          className="field w-44 pl-9"
        >
          {dates.map((date) => <option key={date} value={date}>{formatDate(date)}</option>)}
        </select>
      </label>
    </PageHeader>
  );
}
