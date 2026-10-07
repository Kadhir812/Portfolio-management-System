import { useEffect, useMemo, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { api } from '../api/client';
import { GridCard } from '../components/grid/GridCard';
import { actionsCol } from '../components/grid/columns';
import { Notice } from '../components/Notice';
import { PageHeader } from '../components/PageHeader';
import { ThemeEditor } from '../components/theme/ThemeEditor';
import { themeColumns } from '../components/theme/themeColumns';
import { Button } from '../components/ui/button';

export function ThemeEditorPage() {
  const [themes, setThemes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');

  useEffect(() => {
    api.themes.list()
      .then(setThemes)
      .catch((e) => setError(e.message || 'Unable to load themes'))
      .finally(() => setLoading(false));
  }, []);

  const removeTheme = async (theme) => {
    if (!window.confirm(`Delete "${theme.label}"? This cannot be undone.`)) return;
    try {
      setError('');
      await api.themes.deleteDefinition(theme.theme);
      setThemes((list) => list.filter((item) => item.theme !== theme.theme));
      if (selected === theme.theme) {
        setSelected(null);
      }
      if (editing && current && current.theme === theme.theme) {
        setEditing(false);
      }
    } catch (e) {
      setError(e.message || 'Unable to delete theme');
    }
  };

  const columns = useMemo(() => [
    ...themeColumns(),
    actionsCol(({ data }) => (
      <div className="flex gap-1">
        <Button size="icon" variant="ghost" title="Edit" aria-label={`Edit ${data.label}`} onClick={() => { setSelected(data.theme); setEditing(true); }}><Pencil /></Button>
        <Button size="icon" variant="ghost" className="text-neg hover:bg-neg/10 hover:text-neg" title="Delete theme" aria-label={`Delete ${data.label}`} onClick={() => removeTheme(data)}><Trash2 /></Button>
      </div>
    ), 120)
  ], [removeTheme]);
  const current = themes.find((theme) => theme.theme === selected);

  return (
    <>
      <PageHeader title="Themes" description="A theme sets how much of a portfolio belongs in each asset class. Select a theme to edit it.">
        <Button disabled={!current || editing} onClick={() => { setSaved(''); setEditing(true); }}><Pencil /> Edit theme</Button>
      </PageHeader>
      <Notice tone="error">{error}</Notice>
      <Notice tone="success">{saved}</Notice>

      <GridCard
        title="Investment themes"
        subtitle={current ? `${current.label}: ${current.description || 'No description.'}` : 'Click a row to select it.'}
        exportName="themes"
        rowData={themes}
        columnDefs={columns}
        loading={loading}
        getRowId={({ data }) => data.theme}
        height={Math.min(themes.length * 46 + 70, 360)}
        onRowClicked={({ data }) => { if (!editing) setSelected(data.theme); }}
        rowClassRules={{ 'bg-primary/15': ({ data }) => data?.theme === selected }}
        emptyMessage="No themes available. Check the backend connection."
      />

      {editing && current && (
        <ThemeEditor
          key={current.theme}
          theme={current}
          onCancel={() => setEditing(false)}
          onSaved={(updated) => {
            setThemes((list) => list.map((item) => (item.theme === updated.theme ? updated : item)));
            setEditing(false);
            setSaved(`${updated.label} saved.`);
          }}
        />
      )}
    </>
  );
}
