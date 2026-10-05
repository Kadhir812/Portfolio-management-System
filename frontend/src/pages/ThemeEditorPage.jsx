import { useEffect, useMemo, useState } from 'react';
import { Pencil } from 'lucide-react';
import { api } from '../api/client';
import { GridCard } from '../components/grid/GridCard';
import { Notice } from '../components/Notice';
import { PageHeader } from '../components/PageHeader';
import { ThemeEditor } from '../components/theme/ThemeEditor';
import { themeColumns } from '../components/theme/themeColumns';
import { Button } from '../components/ui/button';
import { assetClassMap } from '../lib/assetClassUtils';

export function ThemeEditorPage() {
  const [themes, setThemes] = useState([]);
  const [meta, setMeta] = useState({});
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');

  useEffect(() => {
    Promise.all([api.themes.list(), api.assetClasses.list()])
      .then(([themeData, assetClasses]) => { setThemes(themeData); setMeta(assetClassMap(assetClasses)); })
      .catch((e) => setError(e.message || 'Unable to load themes'))
      .finally(() => setLoading(false));
  }, []);

  const columns = useMemo(() => themeColumns(meta), [meta]);
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
