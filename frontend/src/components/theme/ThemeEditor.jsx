import { useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import { api } from '../../api/client';
import { DataGrid } from '../grid/DataGrid';
import { assetClassCol, categoryCol } from '../grid/columns';
import { Notice } from '../Notice';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { horizonOptions, percentageMatches, riskOptions, themePayload, validateThemeDraft } from '../../lib/themeConfig';

const startDraft = (theme) => ({
  label: theme.label,
  risk: theme.risk,
  investmentHorizon: theme.investmentHorizon,
  description: theme.description || '',
  allocations: theme.allocations.map(({ assetClass, percentage }) => ({ assetClass, percentage })),
  equity: (theme.equityAllocations || []).map(({ equityCategory, percentage }) => ({ equityCategory, percentage }))
});

const total = (rows) => rows.reduce((sum, row) => sum + Number(row.percentage || 0), 0);

/**
 * Edit one theme: name, risk, horizon, description, asset class weights and equity category weights.
 * Saves everything in one request (PUT /themes/{theme}/definition). Remount with `key={theme.theme}` to switch themes.
 */
export function ThemeEditor({ theme, onSaved, onCancel }) {
  const [draft, setDraft] = useState(() => startDraft(theme));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (field, value) => setDraft((current) => ({ ...current, [field]: value }));

  const equityTarget = Number(draft.allocations.find((row) => row.assetClass === 'EQUITY')?.percentage || 0);
  const assetOk = percentageMatches(total(draft.allocations), 100);
  const equityOk = percentageMatches(total(draft.equity), equityTarget);

  const percentColumn = (key) => ({
    field: 'percentage',
    headerName: 'Weight (%)',
    type: 'rightAligned',
    editable: true,
    singleClickEdit: true,
    cellEditor: 'agNumberCellEditor',
    cellEditorParams: { min: 0, max: 100, precision: 2 },
    cellClass: 'cell-input',
    sortable: false,
    filter: false,
    valueSetter: ({ data, newValue }) => {
      setDraft((current) => ({
        ...current,
        [key]: current[key].map((row) => ((row.assetClass ?? row.equityCategory) === (data.assetClass ?? data.equityCategory)
          ? { ...row, percentage: newValue === null || newValue === '' ? '' : Number(newValue) }
          : row))
      }));
      return false;
    }
  });

  const assetColumns = useMemo(() => [assetClassCol(), percentColumn('allocations')], []); // eslint-disable-line react-hooks/exhaustive-deps
  const equityColumns = useMemo(() => [categoryCol('equityCategory', 'Equity category'), percentColumn('equity')], []); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async () => {
    const problem = validateThemeDraft(draft, draft.equity);
    if (problem) { setError(problem); return; }
    try {
      setSaving(true);
      setError('');
      const updated = await api.themes.updateDefinition(theme.theme, themePayload(draft, draft.equity));
      onSaved(updated);
    } catch (e) {
      setError(e.message || 'Unable to save theme');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">Edit {theme.label}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">Changes apply to every portfolio that uses this theme.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving}><Check />{saving ? 'Saving…' : 'Save theme'}</Button>
        </div>
      </div>

      <Notice tone="error" className="mt-4">{error}</Notice>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <label><span className="field-label">Theme name</span>
          <input className="field" value={draft.label} onChange={(e) => set('label', e.target.value)} />
        </label>
        <label><span className="field-label">Risk</span>
          <select className="field" value={draft.risk} onChange={(e) => set('risk', e.target.value)}>
            {riskOptions.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label><span className="field-label">Investment horizon</span>
          <select className="field" value={draft.investmentHorizon} onChange={(e) => set('investmentHorizon', e.target.value)}>
            {horizonOptions.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label className="md:col-span-3"><span className="field-label">Description</span>
          <textarea className="field h-auto min-h-20 py-2" value={draft.description} onChange={(e) => set('description', e.target.value)} />
        </label>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div>
          <DataGrid rowData={draft.allocations} columnDefs={assetColumns} getRowId={({ data }) => data.assetClass} height={Math.min(draft.allocations.length * 46 + 52, 340)} pinFirstColumn={false} />
          <p className={`mt-2 text-right text-sm ${assetOk ? 'text-muted-foreground' : 'text-neg'}`}>Asset classes total {total(draft.allocations)}% of 100%</p>
        </div>
        <div>
          <DataGrid rowData={draft.equity} columnDefs={equityColumns} getRowId={({ data }) => data.equityCategory} height={Math.max(draft.equity.length, 3) * 46 + 52} pinFirstColumn={false} emptyMessage="This theme has no equity categories." />
          <p className={`mt-2 text-right text-sm ${equityOk ? 'text-muted-foreground' : 'text-neg'}`}>Equity categories total {total(draft.equity)}% of the {equityTarget}% equity weight</p>
        </div>
      </div>
    </Card>
  );
}
