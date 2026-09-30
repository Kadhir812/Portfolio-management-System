import { useEffect, useMemo, useRef } from 'react';
import {
  ClientSideRowModelModule,
  ModuleRegistry,
  NumberEditorModule,
  NumberFilterModule,
  RowApiModule,
  RowAutoHeightModule,
  RowSelectionModule,
  TextFilterModule,
  themeQuartz
} from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';

ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  RowApiModule,
  RowAutoHeightModule,
  RowSelectionModule,
  NumberEditorModule,
  NumberFilterModule,
  TextFilterModule
]);

const gridTheme = themeQuartz.withParams({ accentColor: '#0284c7' });

export function DataGrid({
  rowData,
  columnDefs,
  getRowId,
  selectedRowId,
  onSelectionChange,
  onCellValueChanged,
  rowSelectionEnabled = true,
  singleClickEdit = false,
  loading = false,
  rowHeight,
  height = 360
}) {
  const gridRef = useRef(null);
  const defaultColDef = useMemo(() => ({
    resizable: true,
    sortable: false,
    filter: false,
    minWidth: 110
  }), []);
  const rowSelection = useMemo(() => ({
    mode: 'singleRow',
    checkboxes: false,
    enableClickSelection: 'enableSelection'
  }), []);

  useEffect(() => {
    if (selectedRowId == null) return;
    const selectedNode = gridRef.current?.api.getRowNode(String(selectedRowId));
    if (selectedNode && !selectedNode.isSelected()) selectedNode.setSelected(true);
  }, [rowData, selectedRowId]);

  const handleSelectionChanged = (event) => {
    onSelectionChange?.(event.api.getSelectedRows()[0] ?? null);
  };

  return (
    <div className="w-full overflow-hidden rounded-lg border border-border" style={{ height }}>
      <AgGridReact
        ref={gridRef}
        theme={gridTheme}
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        getRowId={getRowId}
        rowSelection={rowSelectionEnabled ? rowSelection : undefined}
        onSelectionChanged={rowSelectionEnabled ? handleSelectionChanged : undefined}
        onCellValueChanged={onCellValueChanged}
        singleClickEdit={singleClickEdit}
        rowHeight={rowHeight}
        loading={loading}
      />
    </div>
  );
}