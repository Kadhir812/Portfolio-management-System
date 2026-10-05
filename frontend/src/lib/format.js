// Shared display formatting. Every page imports from here so numbers look the same everywhere.

const LOCALES = { INR: 'en-IN', USD: 'en-US', GBP: 'en-GB' };
const localeFor = (currency) => LOCALES[currency] || 'en-IN';

export const money = (value, currency = 'INR', maxDigits = 2) => new Intl.NumberFormat(localeFor(currency), {
  style: 'currency',
  currency,
  minimumFractionDigits: maxDigits === 0 ? 0 : 2,
  maximumFractionDigits: maxDigits
}).format(Number(value || 0));

export const compactMoney = (value, currency = 'INR') => new Intl.NumberFormat(localeFor(currency), {
  style: 'currency',
  currency,
  notation: 'compact',
  maximumFractionDigits: 1
}).format(Number(value || 0));

export const signedMoney = (value, currency = 'INR') => new Intl.NumberFormat(localeFor(currency), {
  style: 'currency',
  currency,
  signDisplay: 'exceptZero'
}).format(Number(value || 0));

/** Splits "₹3,25,980.65" into { main: "₹3,25,980", decimals: ".65" } so the decimals can be styled lighter. */
export function moneyParts(value, currency = 'INR') {
  const parts = new Intl.NumberFormat(localeFor(currency), {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).formatToParts(Number(value || 0));
  const decimalAt = parts.findIndex((part) => part.type === 'decimal');
  const join = (list) => list.map((part) => part.value).join('');
  return decimalAt === -1
    ? { main: join(parts), decimals: '' }
    : { main: join(parts.slice(0, decimalAt)), decimals: join(parts.slice(decimalAt)) };
}

export const number = (value, maxDigits = 2) => Number(value || 0)
  .toLocaleString('en-IN', { maximumFractionDigits: maxDigits });

export const pct = (value, digits = 2) => `${Number(value || 0).toFixed(digits)}%`;

/** 65 -> "65%", 12.34 -> "12.3%" */
export const trimPct = (value) => {
  const rounded = Math.round(Number(value || 0) * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}%`;
};

export const signedPct = (value, digits = 2) => {
  const n = Number(value || 0);
  const text = Math.abs(n).toFixed(digits);
  return `${n > 0 && Number(text) !== 0 ? '+' : n < 0 && Number(text) !== 0 ? '−' : ''}${text}%`;
};

/** Percentage points, e.g. "+3.2 pp" */
export const signedPp = (value, digits = 1) => {
  const n = Number(value || 0);
  const text = Math.abs(n).toFixed(digits);
  return `${n > 0 && Number(text) !== 0 ? '+' : n < 0 && Number(text) !== 0 ? '−' : ''}${text} pp`;
};

export const formatDate = (value) => (value
  ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(`${value}T12:00:00`))
  : '—');

export const titleCase = (value) => (value || '')
  .replaceAll('_', ' ')
  .toLowerCase()
  .replace(/\b\w/g, (letter) => letter.toUpperCase());

/** Tailwind text colour for a signed number */
export const toneClass = (value) => (Number(value) > 0 ? 'text-pos' : Number(value) < 0 ? 'text-neg' : 'text-muted-foreground');
