import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Save } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

export function ThemeEditorPage() {
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.themes.list()
      .then(setThemes)
      .catch((e) => setError(e.message || 'Unable to load themes'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Theme studio</p>
          <h2 className="mt-1 text-3xl font-bold">Custom themes</h2>
        </div>
        <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Save className="h-4 w-4" />
          Managed by backend
        </span>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {loading ? <p className="text-sm text-muted-foreground">Loading themes...</p> : null}
      <div className="space-y-5">
        {themes.map((theme) => (
          <Card key={theme.theme}>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                  <CardTitle>{theme.label}</CardTitle>
                <div className="mt-2 flex gap-2">
                  <Badge variant="outline">{theme.risk}</Badge>
                  <Badge variant="secondary">{theme.investmentHorizon}</Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="overflow-hidden rounded-xl border border-border">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted text-muted-foreground">
                    <tr>
                      <th className="px-3 py-3 font-medium">Asset class</th>
                      <th className="px-3 py-3 font-medium">Weight %</th>
                      <th className="px-3 py-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {theme.allocations.map((allocation, index) => (
                      <tr key={`${theme.theme}-${allocation.assetClass}`} className="border-t border-border">
                        <td className="px-3 py-3">{allocation.assetClass.replace('_', ' ')}</td>
                        <td className="px-3 py-3">{allocation.percentage}%</td>
                        <td className="px-3 py-3 text-right">Read-only</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
