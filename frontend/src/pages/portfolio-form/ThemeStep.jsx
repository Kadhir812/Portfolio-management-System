import { useMemo, useState } from 'react';
import { ArrowRight, Pencil } from 'lucide-react';
import { GridCard } from '../../components/grid/GridCard';
import { Notice } from '../../components/Notice';
import { ThemeEditor } from '../../components/theme/ThemeEditor';
import { themeColumns } from '../../components/theme/themeColumns';
import { categoryCol, pctCol } from '../../components/grid/columns';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';

export function ThemeStep({ themes, loading, selected, onSelect, onThemeSaved, saving, onBack, onNext }) {
  const [editing, setEditing] = useState(false);
  const columns = useMemo(() => themeColumns(), []);
  const equityColumns = useMemo(() => [categoryCol('equityCategory', 'Equity category'), pctCol('percentage', 'Target')], []);
  const current = themes.find((theme) => theme.theme === selected);

  return (
    <div className="space-y-4">
      <GridCard
        title="Choose an investment theme"
        subtitle="Click a row to select it. Sort or filter by risk and horizon from the column headers."
        exportName="themes"
        rowData={themes}
        columnDefs={columns}
        loading={loading}
        getRowId={({ data }) => data.theme}
        height={Math.min(themes.length * 46 + 70, 360)}
        onRowClicked={({ data }) => { if (!editing) onSelect(data.theme); }}
        rowClassRules={{ 'bg-primary/15': ({ data }) => data?.theme === selected }}
        emptyMessage="No themes available. Check the backend connection."
      />

      {current && !editing && (
        <GridCard
          title="Equity category targets"
          subtitle="Large, mid and small cap limits within equity."
          searchable={false}
          rowData={current.equityAllocations || []}
          columnDefs={equityColumns}
          getRowId={({ data }) => data.equityCategory}
          height={Math.max((current.equityAllocations || []).length * 46 + 70, 160)}
          emptyMessage="No equity category targets are configured for this theme."
        />
      )}

      {current && !editing && (
        <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">{current.label}.</span> {current.description || 'No description.'}</p>
          <Button variant="outline" onClick={() => setEditing(true)}><Pencil /> Edit theme</Button>
        </Card>
      )}

      {editing && current && (
        <ThemeEditor key={current.theme} theme={current} onCancel={() => setEditing(false)} onSaved={(t) => { onThemeSaved(t); setEditing(false); }} />
      )}

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={onNext} disabled={!selected || saving || editing}>{saving ? 'Saving…' : 'Continue to holdings'}<ArrowRight /></Button>
      </div>
      {!selected && <Notice tone="info">Select a theme to continue.</Notice>}
    </div>
  );
}
