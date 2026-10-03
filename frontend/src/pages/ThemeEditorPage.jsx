import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Check, Pencil, Save, X } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  horizonOptions,
  percentageMatches,
  riskOptions,
  themePayload,
  validateThemeDraft
} from '../lib/themeConfig';
import { assetClassMap, formatAssetClass } from '../lib/assetClassUtils';

export function ThemeEditorPage() {
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingTheme, setEditingTheme] = useState(null);
  const [draftAllocations, setDraftAllocations] = useState([]);
  const [draftDefinition, setDraftDefinition] = useState(null);
  const [savingTheme, setSavingTheme] = useState(false);
  const [assetClassMetadata, setAssetClassMetadata] = useState({});

  useEffect(() => {
    Promise.all([api.themes.list(), api.assetClasses.list()])
      .then(([themeData, assetClasses]) => {
        setThemes(themeData);
        setAssetClassMetadata(assetClassMap(assetClasses));
      })
      .catch((e) => setError(e.message || 'Unable to load themes'))
      .finally(() => setLoading(false));
  }, []);

  const startEditing = (theme) => {
    setError('');
    setEditingTheme(theme.theme);
    setDraftDefinition({
      label: theme.label,
      risk: theme.risk,
      investmentHorizon: theme.investmentHorizon,
      description: theme.description || '',
      allocations: theme.allocations.map((allocation) => ({
        assetClass: allocation.assetClass,
        percentage: allocation.percentage
      }))
    });
    setDraftAllocations(theme.equityAllocations.map((allocation) => ({
      equityCategory: allocation.equityCategory,
      percentage: allocation.percentage
    })));
  };

  const cancelEditing = () => {
    setEditingTheme(null);
    setDraftDefinition(null);
    setDraftAllocations([]);
  };

  const updateEquityDraft = (equityCategory, percentage) => {
    setDraftAllocations((current) => current.map((allocation) => (
      allocation.equityCategory === equityCategory
        ? { ...allocation, percentage }
        : allocation
    )));
  };

  const updateAssetClassDraft = (assetClass, percentage) => {
    setDraftDefinition((current) => ({
      ...current,
      allocations: current.allocations.map((allocation) => (
        allocation.assetClass === assetClass
          ? { ...allocation, percentage }
          : allocation
      ))
    }));
  };

  const saveTheme = async (theme) => {
    const validationError = validateThemeDraft(draftDefinition, draftAllocations);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSavingTheme(true);
      setError('');
      const updated = await api.themes.updateDefinition(theme.theme, themePayload(draftDefinition, draftAllocations));
      setThemes((current) => current.map((item) => item.theme === updated.theme ? updated : item));
      cancelEditing();
    } catch (e) {
      setError(e.message || 'Unable to save theme configuration');
    } finally {
      setSavingTheme(false);
    }
  };

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
                  <CardTitle>{editingTheme === theme.theme ? draftDefinition.label : theme.label}</CardTitle>
                <div className="mt-2 flex gap-2">
                  <Badge variant="outline">{editingTheme === theme.theme ? draftDefinition.risk : theme.risk}</Badge>
                  <Badge variant="secondary">{editingTheme === theme.theme ? draftDefinition.investmentHorizon : theme.investmentHorizon}</Badge>
                </div>
              </div>
              {editingTheme === theme.theme ? (
                <div className="flex gap-2">
                  <button type="button" onClick={() => saveTheme(theme)} disabled={savingTheme} className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50">
                    <Check className="h-4 w-4" /> Save
                  </button>
                  <button type="button" onClick={cancelEditing} disabled={savingTheme} className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-sm disabled:opacity-50">
                    <X className="h-4 w-4" /> Cancel
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => startEditing(theme)} className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-sm">
                  <Pencil className="h-4 w-4" /> Edit theme
                </button>
              )}
            </CardHeader>

            <CardContent>
              {editingTheme === theme.theme ? (
                <div className="mb-4 grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-2">
                  <label className="text-sm">
                    Theme name
                    <input
                      value={draftDefinition.label}
                      onChange={(event) => setDraftDefinition((current) => ({ ...current, label: event.target.value }))}
                      className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1"
                    />
                  </label>
                  <label className="text-sm">
                    Risk
                    <select
                      value={draftDefinition.risk}
                      onChange={(event) => setDraftDefinition((current) => ({ ...current, risk: event.target.value }))}
                      className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1"
                    >
                      {riskOptions.map((risk) => <option key={risk} value={risk}>{risk}</option>)}
                    </select>
                  </label>
                  <label className="text-sm">
                    Investment horizon
                    <select
                      value={draftDefinition.investmentHorizon}
                      onChange={(event) => setDraftDefinition((current) => ({ ...current, investmentHorizon: event.target.value }))}
                      className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1"
                    >
                      {horizonOptions.map((horizon) => <option key={horizon} value={horizon}>{horizon}</option>)}
                    </select>
                  </label>
                  <label className="text-sm sm:col-span-2">
                    Description
                    <textarea
                      value={draftDefinition.description}
                      onChange={(event) => setDraftDefinition((current) => ({ ...current, description: event.target.value }))}
                      className="mt-1 min-h-20 w-full rounded-md border border-input bg-background px-2 py-1"
                    />
                  </label>
                </div>
              ) : (
                <p className="mb-4 text-sm text-muted-foreground">{theme.description || 'No description provided.'}</p>
              )}
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
                        <td className="px-3 py-3" title={assetClassMetadata[allocation.assetClass]?.assetDescription}>
                          {formatAssetClass(allocation.assetClass, assetClassMetadata)}
                        </td>
                        <td className="px-3 py-3">
                          {editingTheme === theme.theme ? (
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={draftDefinition.allocations.find((item) => item.assetClass === allocation.assetClass)?.percentage ?? ''}
                              onChange={(event) => updateAssetClassDraft(allocation.assetClass, event.target.value)}
                              className="w-28 rounded-md border border-input bg-background px-2 py-1"
                              aria-label={`${formatAssetClass(allocation.assetClass, assetClassMetadata)} allocation percentage`}
                            />
                          ) : `${allocation.percentage}%`}
                        </td>
                        <td className="px-3 py-3 text-right">{editingTheme === theme.theme ? 'Editable' : 'Read-only'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {editingTheme === theme.theme ? (
                <p className={`mt-2 text-right text-sm ${
                  percentageMatches(draftDefinition.allocations.reduce((sum, allocation) => sum + Number(allocation.percentage || 0), 0), 100)
                    ? 'text-muted-foreground'
                    : 'text-red-600'
                }`}>
                  Asset-class total: {draftDefinition.allocations.reduce((sum, allocation) => sum + Number(allocation.percentage || 0), 0)}% / 100%
                </p>
              ) : null}
              {theme.equityAllocations?.length ? (
                <div className="mt-4 rounded-xl border border-border p-4">
                  <p className="text-sm font-medium">Equity category targets</p>
                  {editingTheme === theme.theme ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Total must equal the EQUITY allocation ({draftDefinition.allocations.find((allocation) => allocation.assetClass === 'EQUITY')?.percentage || 0}%).
                    </p>
                  ) : null}
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    {theme.equityAllocations.map((allocation) => (
                      <div key={`${theme.theme}-${allocation.equityCategory}`} className="rounded-lg bg-muted/50 px-3 py-2">
                        <p className="text-xs text-muted-foreground">{allocation.equityCategory.replace('_', ' ')}</p>
                        {editingTheme === theme.theme ? (
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={draftAllocations.find((item) => item.equityCategory === allocation.equityCategory)?.percentage ?? ''}
                            onChange={(event) => updateEquityDraft(allocation.equityCategory, event.target.value)}
                            className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1 font-semibold"
                            aria-label={`${allocation.equityCategory.replace('_', ' ')} target percentage`}
                          />
                        ) : (
                          <p className="mt-1 font-semibold">{allocation.percentage}%</p>
                        )}
                      </div>
                    ))}
                  </div>
                  {editingTheme === theme.theme ? (
                    <p className={`mt-2 text-right text-sm ${
                      percentageMatches(
                        draftAllocations.reduce((sum, allocation) => sum + Number(allocation.percentage || 0), 0),
                        Number(draftDefinition.allocations.find((allocation) => allocation.assetClass === 'EQUITY')?.percentage || 0)
                      ) ? 'text-muted-foreground' : 'text-red-600'
                    }`}>
                      Equity-category total: {draftAllocations.reduce((sum, allocation) => sum + Number(allocation.percentage || 0), 0)}%
                    </p>
                  ) : null}
                </div>
              ) : null}

            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
