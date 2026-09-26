import { useState } from 'react';
import { Plus, Trash2, Save } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

const initialThemes = [
  {
    id: 1,
    name: 'Conservative',
    risk: 'Moderate',
    horizon: 'Medium Term',
    allocations: [
      { assetClass: 'Stocks', percentage: 20 },
      { assetClass: 'Bonds', percentage: 35 },
      { assetClass: 'ETFs', percentage: 25 },
      { assetClass: 'REITs', percentage: 20 }
    ]
  },
  {
    id: 2,
    name: 'Moderately Aggressive',
    risk: 'High',
    horizon: 'Long Term',
    allocations: [
      { assetClass: 'Stocks', percentage: 40 },
      { assetClass: 'Crypto', percentage: 15 },
      { assetClass: 'Mutual Funds', percentage: 20 },
      { assetClass: 'Bonds', percentage: 15 },
      { assetClass: 'ETFs', percentage: 10 }
    ]
  }
];

export function ThemeEditorPage() {
  const [themes, setThemes] = useState(initialThemes);

  const updateAllocation = (themeId, index, field, value) => {
    setThemes((current) =>
      current.map((theme) =>
        theme.id === themeId
          ? {
              ...theme,
              allocations: theme.allocations.map((item, i) =>
                i === index ? { ...item, [field]: field === 'percentage' ? Number(value) : value } : item
              )
            }
          : theme
      )
    );
  };

  const addAllocation = (themeId) => {
    setThemes((current) =>
      current.map((theme) =>
        theme.id === themeId
          ? {
              ...theme,
              allocations: [...theme.allocations, { assetClass: 'New Asset', percentage: 0 }]
            }
          : theme
      )
    );
  };

  const removeAllocation = (themeId, index) => {
    setThemes((current) =>
      current.map((theme) =>
        theme.id === themeId
          ? {
              ...theme,
              allocations: theme.allocations.filter((_, i) => i !== index)
            }
          : theme
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Theme studio</p>
          <h2 className="mt-1 text-3xl font-bold">Custom themes</h2>
        </div>
        <Button className="gap-2">
          <Save className="h-4 w-4" />
          Save themes
        </Button>
      </div>

      <div className="space-y-5">
        {themes.map((theme) => (
          <Card key={theme.id}>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle>{theme.name}</CardTitle>
                <div className="mt-2 flex gap-2">
                  <Badge variant="outline">{theme.risk}</Badge>
                  <Badge variant="secondary">{theme.horizon}</Badge>
                </div>
              </div>
              <Button variant="outline" className="text-red-600 hover:bg-red-500/10 hover:text-red-600">
                <Trash2 className="h-4 w-4" />
              </Button>
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
                      <tr key={`${theme.id}-${allocation.assetClass}-${index}`} className="border-t border-border">
                        <td className="px-3 py-3">
                          <input
                            value={allocation.assetClass}
                            onChange={(e) => updateAllocation(theme.id, index, 'assetClass', e.target.value)}
                            className="w-full rounded-md border border-border bg-background px-3 py-2 outline-none ring-0 focus:border-foreground"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <input
                            type="number"
                            value={allocation.percentage}
                            onChange={(e) => updateAllocation(theme.id, index, 'percentage', e.target.value)}
                            className="w-28 rounded-md border border-border bg-background px-3 py-2 outline-none ring-0 focus:border-foreground"
                          />
                        </td>
                        <td className="px-3 py-3 text-right">
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0 text-red-600 hover:bg-red-500/10 hover:text-red-600"
                            onClick={() => removeAllocation(theme.id, index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex justify-end">
                <Button variant="outline" className="gap-2" onClick={() => addAllocation(theme.id)}>
                  <Plus className="h-4 w-4" />
                  Add asset type
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
