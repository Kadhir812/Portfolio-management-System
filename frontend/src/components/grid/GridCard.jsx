import { useRef, useState } from 'react';
import { Download, Search } from 'lucide-react';
import { Card } from '../ui/card';
import { DataGrid } from './DataGrid';

/**
 * A titled card around a DataGrid, with a search box (filters every column) and CSV export.
 * Use `toolbar` for extra controls on the left of the search and `actions` for buttons on the right.
 */
export function GridCard({ title, subtitle, toolbar, actions, searchable = true, exportName, rowData, className, ...gridProps }) {
  const apiRef = useRef(null);
  const [query, setQuery] = useState('');
  const count = rowData?.length ?? 0;

  return (
    <Card className={className}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="min-w-0">
          <h3 className="text-base font-semibold">{title}</h3>
          {subtitle ? <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {toolbar}
          {searchable ? (
            <label className="relative">
              <span className="sr-only">Search {title}</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={`Search ${count} rows`}
                className="field h-9 w-48 pl-9"
              />
            </label>
          ) : null}
          {exportName ? (
            <button
              type="button"
              onClick={() => apiRef.current?.exportDataAsCsv({ fileName: `${exportName}.csv` })}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-input px-3 text-sm text-muted-foreground transition hover:bg-accent hover:text-foreground"
              title="Download as CSV"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          ) : null}
          {actions}
        </div>
      </div>
      <div className="p-3">
        <DataGrid
          rowData={rowData}
          quickFilterText={query}
          onGridReady={(event) => { apiRef.current = event.api; }}
          {...gridProps}
        />
      </div>
    </Card>
  );
}
