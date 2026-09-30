import { label, money } from './dashboardUtils';

export function DashboardHoldingsTable({ valuation, holdings, currency, formatDate }) {
  return (
    <section className="rounded-[28px] border border-slate-800 bg-slate-900/70 p-5">
      <h3 className="mb-4 text-lg font-semibold text-white">Holdings on {formatDate(valuation.requestedDate)}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-slate-300">
            <tr>
              <th className="py-2">Security</th>
              <th>Shares</th>
              <th>Price</th>
              <th>Model target</th>
              <th>Current value</th>
              <th className="text-right">Difference</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((holding, index) => <tr className="border-t border-slate-800 text-slate-100" key={holding.securityId ?? holding.isin ?? `${holding.symbol || holding.securityName || 'holding'}-${index}`}>
              <td className="py-3">
                <div className="font-medium">{holding.symbol || holding.securityName}</div>
                <div className="text-xs text-slate-300">{label(holding.assetClass)}</div>
              </td>
              <td>{Number(holding.shares).toLocaleString('en-IN')}</td>
              <td>{money(holding.currentPrice, currency)}</td>
              <td>{holding.targetAmount == null ? '—' : <>
                <div>{money(holding.targetAmount, currency)}</div>
                <div className="text-xs text-slate-300">{Number(holding.targetPercentage).toFixed(2)}% of portfolio</div>
              </>}</td>
              <td>{money(holding.value, currency)}</td>
              <td className={`text-right ${holding.difference > 0 ? 'text-amber-300' : holding.difference < 0 ? 'text-sky-300' : 'text-emerald-300'}`}>
                {holding.difference == null ? '—' : `${holding.difference > 0 ? '+' : ''}${money(holding.difference, currency)}`}
              </td>
            </tr>)}
            {!holdings.length && <tr><td colSpan="6" className="py-5 text-slate-300">No holdings were held on this date.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}