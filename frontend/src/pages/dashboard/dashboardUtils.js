export const money = (value, currency = 'INR') => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency,
  maximumFractionDigits: 2
}).format(Number(value || 0));

export const label = (value) => value === 'EQUITY'
  ? 'Equity'
  : (value || '').replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());

export function formatDate(value) {
  return value
    ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(`${value}T12:00:00`))
    : '—';
}

export function monthDates(start, end) {
  if (!start || !end) return [];
  const first = new Date(`${start}T12:00:00`);
  const last = new Date(`${end}T12:00:00`);
  const dates = [];
  for (let offset = 0; offset < 240; offset += 1) {
    const month = new Date(first.getFullYear(), first.getMonth() + offset, 1, 12);
    const day = Math.min(first.getDate(), new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate());
    month.setDate(day);
    if (month > last) break;
    dates.push(`${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
  }
  return dates;
}