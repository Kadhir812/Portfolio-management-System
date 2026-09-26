import { useState } from 'react';
import { Plus, Trash2, Save } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

const initialRows = [
  { id: 1, assetClass: 'Stocks', name: 'TCS', shares: 120, price: 4020, total: 482400 },
  { id: 2, assetClass: 'Bonds', name: 'SBI Bond', shares: 200, price: 950, total: 190000 },
  { id: 3, assetClass: 'ETFs', name: 'NIFTY ETF', shares: 80, price: 1750, total: 140000 }
];

export function HoldingsPage() {
  const [rows, setRows] = useState(initialRows);

  const updateRow = (id, field, value) => {
    setRows((current) =>
      current.map((row) =>
        row.id === id ? { ...row, [field]: field === 'shares' || field === 'price' ? Number(value) : value } : row
      )
    );
  };

  const addRow = () => {
    setRows((current) => [
      ...current,
      { id: Date.now(), assetClass: 'Stocks', name: 'New Security', shares: 0, price: 0, total: 0 }
    ]);
  };

  const removeRow = (id) => {
    setRows((current) => current.filter((row) => row.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Asset management</p>
          <h2 className="mt-1 text-3xl font-bold">Holdings</h2>
        </div>
        <Button className="gap-2">
          <Save className="h-4 w-4" />
          Save holdings
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Portfolio allocation</CardTitle>
            <div className="mt-2 flex gap-2">
              <Badge variant="outline">Theme: Conservative</Badge>
              <Badge variant="secondary">Allocation complete</Badge>
            </div>
          </div>
          <Button variant="outline" className="gap-2" onClick={addRow}>
            <Plus className="h-4 w-4" />
            Add security
          </Button>
        </CardHeader>

        <CardContent>
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
                  <th className="px-3 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.id} className="border-t border-border align-middle">
                    <td className="px-3 py-3">{index + 1}</td>
                    <td className="px-3 py-3">
                      <select
                        value={row.assetClass}
                        onChange={(e) => updateRow(row.id, 'assetClass', e.target.value)}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 outline-none ring-0 focus:border-foreground"
                      >
                        <option>Stocks</option>
                        <option>Mutual Funds</option>
                        <option>Commodities</option>
                        <option>Bonds</option>
                        <option>Crypto</option>
                        <option>REITs</option>
                        <option>ETFs</option>
                        <option>Cash</option>
                      </select>
                    </td>
                    <td className="px-3 py-3">
                      <input
                        value={row.name}
                        onChange={(e) => updateRow(row.id, 'name', e.target.value)}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 outline-none ring-0 focus:border-foreground"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        value={row.shares}
                        onChange={(e) => updateRow(row.id, 'shares', e.target.value)}
                        className="w-24 rounded-md border border-border bg-background px-3 py-2 outline-none ring-0 focus:border-foreground"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        value={row.price}
                        onChange={(e) => updateRow(row.id, 'price', e.target.value)}
                        className="w-28 rounded-md border border-border bg-background px-3 py-2 outline-none ring-0 focus:border-foreground"
                      />
                    </td>
                    <td className="px-3 py-3 font-medium">₹{(row.shares * row.price).toLocaleString('en-IN')}</td>
                    <td className="px-3 py-3 text-right">
                      <Button
                        variant="ghost"
                        className="h-8 w-8 p-0 text-red-600 hover:bg-red-500/10 hover:text-red-600"
                        onClick={() => removeRow(row.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
