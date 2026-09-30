import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { formatDate, label, money } from './dashboardUtils';

export function PortfolioCompositionDialog({ open, onClose, portfolio, theme, valuation, rows, currency }) {
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    closeButtonRef.current?.focus();
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="composition-title" className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-border bg-background p-5 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{portfolio?.name || 'Portfolio'} · {theme?.label || label(portfolio?.theme)}</p>
            <h2 id="composition-title" className="mt-1 text-2xl font-bold">Portfolio composition by theme</h2>
          </div>
          <button ref={closeButtonRef} type="button" onClick={onClose} aria-label="Close portfolio composition" className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Initial investment</p>
            <p className="mt-1 text-xl font-semibold">{money(portfolio?.amount, currency)}</p>
          </div>
          <div className="rounded-lg border border-border p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Current portfolio value</p>
            <p className="mt-1 text-xl font-semibold">{valuation ? money(valuation.totalValue, currency) : 'Not available yet'}</p>
            {valuation && <p className="mt-1 text-xs text-muted-foreground">Prices through {formatDate(valuation.effectiveDate)} · viewed as of {formatDate(valuation.requestedDate)}</p>}
          </div>
        </div>

        <div className="mt-5 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-3 py-3 font-medium">Asset class</th>
                <th className="px-3 py-3 text-right font-medium">As per theme</th>
                <th className="px-3 py-3 text-right font-medium">Initial investment</th>
                <th className="px-3 py-3 text-right font-medium">Actual allocation</th>
                <th className="px-3 py-3 text-right font-medium">Current value</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => <tr key={row.assetClass} className="border-t border-border">
                <td className="px-3 py-3 font-medium">{label(row.assetClass)}</td>
                <td className="px-3 py-3 text-right">{row.targetPercentage.toFixed(2)}%</td>
                <td className="px-3 py-3 text-right">{money(row.targetAmount, currency)}</td>
                <td className="px-3 py-3 text-right">{row.currentPercentage == null ? '—' : `${row.currentPercentage.toFixed(2)}%`}</td>
                <td className="px-3 py-3 text-right">{row.currentValue == null ? '—' : money(row.currentValue, currency)}</td>
              </tr>)}
              {!rows.length && <tr><td colSpan="5" className="px-3 py-6 text-center text-muted-foreground">No theme allocation is attached to this portfolio.</td></tr>}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Initial investment amounts use the portfolio amount and theme percentages. Current values use prices for the selected date.</p>
      </section>
    </div>
  );
}