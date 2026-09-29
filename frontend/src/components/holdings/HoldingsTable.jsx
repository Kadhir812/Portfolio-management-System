import { RefreshCcw, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

export function HoldingsTable({ rows, summary, targetAmount, saving, loading, error, onUpdateShares, onRemove, onRefresh }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle>Portfolio allocation</CardTitle>
          <div className="mt-2 flex gap-2">
            <span className="rounded-full border border-border px-2 py-1 text-[10px] uppercase tracking-[0.16em]">Live backend data</span>
            <span className="rounded-full bg-muted px-2 py-1 text-[10px] uppercase tracking-[0.16em]">{summary.holdingCount} holdings</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}
        {loading ? <p className="mb-4 text-sm text-muted-foreground">Loading holdings...</p> : null}
        {!loading && rows.length === 0 ? <p className="mb-4 text-sm text-muted-foreground">No holdings yet. Add an eligible security above.</p> : null}
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-3 py-3 font-medium">S.No</th>
                <th className="px-3 py-3 font-medium">Asset class</th>
                <th className="px-3 py-3 font-medium">Name</th>
                <th className="px-3 py-3 font-medium">No. of shares</th>
                <th className="px-3 py-3 font-medium">Price / share</th>
                <th className="px-3 py-3 font-medium">Total value</th>
                <th className="px-3 py-3 font-medium">Portfolio %</th>
                <th className="px-3 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.id} className="border-t border-border align-middle">
                  <td className="px-3 py-3">{index + 1}</td>
                  <td className="px-3 py-3"><input value={row.assetClass || ''} readOnly className="w-full rounded-md border border-border bg-background px-3 py-2 outline-none" /></td>
                  <td className="px-3 py-3"><input value={row.securityName || row.symbol || ''} readOnly className="w-full rounded-md border border-border bg-background px-3 py-2 outline-none" /></td>
                  <td className="px-3 py-3"><input type="number" value={row.shares || 0} onChange={(event) => onUpdateShares(row.id, event.target.value)} disabled={saving} className="w-24 rounded-md border border-border bg-background px-3 py-2 outline-none" /></td>
                  <td className="px-3 py-3"><input type="number" value={row.price || 0} readOnly className="w-28 rounded-md border border-border bg-background px-3 py-2 outline-none" /></td>
                  <td className="px-3 py-3 font-medium">₹{Number(row.value || 0).toLocaleString('en-IN')}</td>
                  <td className="px-3 py-3 font-medium">{targetAmount > 0 ? `${((Number(row.value || 0) / targetAmount) * 100).toFixed(2)}%` : '0.00%'}</td>
                  <td className="px-3 py-3 text-right">
                    <Button variant="ghost" className="h-8 w-8 p-0 text-red-600 hover:bg-red-500/10 hover:text-red-600" onClick={() => onRemove(row.id)} disabled={saving}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="ghost" className="gap-2" onClick={onRefresh} disabled={loading || saving}>
            <RefreshCcw className="h-4 w-4" />
            Refresh data
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
