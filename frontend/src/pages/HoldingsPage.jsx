import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Trash2, Save } from 'lucide-react';
import { api } from '../api/client';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

export function HoldingsPage() {
  const { id: portfolioId } = useParams();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!portfolioId) {
      setError('Select a portfolio to view holdings.');
      setLoading(false);
      return;
    }

    api.holdings.list(portfolioId)
      .then(setRows)
      .catch((e) => setError(e.message || 'Unable to load holdings'))
      .finally(() => setLoading(false));
  }, [portfolioId]);

  const updateRow = (id, field, value) => {
    setRows((current) =>
      current.map((row) =>
        row.id === id ? { ...row, [field]: field === 'shares' || field === 'price' ? Number(value) : value } : row
      )
    );
  };

  const removeRow = async (holdingId) => {
    try {
      await api.holdings.remove(portfolioId, holdingId);
      setRows((current) => current.filter((row) => row.id !== holdingId));
    } catch (e) {
      setError(e.message || 'Unable to remove holding');
    }
  };

  const saveHoldings = async () => {
    try {
      await api.holdings.save(portfolioId);
    } catch (e) {
      setError(e.message || 'Unable to save holdings');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Asset management</p>
          <h2 className="mt-1 text-3xl font-bold">Holdings</h2>
        </div>
        <Button className="gap-2" onClick={saveHoldings} disabled={!portfolioId || loading}>
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
        </CardHeader>

        <CardContent>
          {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}
          {loading ? <p className="mb-4 text-sm text-muted-foreground">Loading holdings...</p> : null}
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
                      <input
                        value={row.assetClass || ''}
                        readOnly
                        className="w-full rounded-md border border-border bg-background px-3 py-2 outline-none ring-0 focus:border-foreground"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        value={row.securityName || row.symbol || ''}
                        readOnly
                        className="w-full rounded-md border border-border bg-background px-3 py-2 outline-none ring-0 focus:border-foreground"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        value={row.shares || 0}
                        readOnly
                        className="w-24 rounded-md border border-border bg-background px-3 py-2 outline-none ring-0 focus:border-foreground"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        value={row.price || 0}
                        readOnly
                        className="w-28 rounded-md border border-border bg-background px-3 py-2 outline-none ring-0 focus:border-foreground"
                      />
                    </td>
                    <td className="px-3 py-3 font-medium">₹{Number(row.value || 0).toLocaleString('en-IN')}</td>
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
