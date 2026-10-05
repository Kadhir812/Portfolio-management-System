import { themeQuartz, colorSchemeDark } from 'ag-grid-community';

// Two AG Grid themes: black/white surfaces to match src/index.css, original purple accent. DataGrid picks one from the colour mode.
const shared = {
  headerFontWeight: 600,
  headerFontSize: 12.5,
  fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif',
  fontSize: 13,
  rowHeight: 46,
  headerHeight: 42,
  wrapperBorderRadius: 12
};

export const gridThemes = {
  dark: themeQuartz.withPart(colorSchemeDark).withParams({
    ...shared,
    backgroundColor: '#0d0d0d',
    foregroundColor: '#fafafa',
    borderColor: '#292929',
    accentColor: '#7c5cff',
    headerBackgroundColor: '#141414',
    headerTextColor: '#a1a1a1',
    oddRowBackgroundColor: '#0a0a0a',
    rowHoverColor: 'rgba(124, 92, 255, 0.12)',
    pinnedColumnBorder: { style: 'solid', width: 1, color: '#3d3d3d' }
  }),
  light: themeQuartz.withParams({
    ...shared,
    backgroundColor: '#ffffff',
    foregroundColor: '#0d0d0d',
    borderColor: '#e0e0e0',
    accentColor: '#7c5cff',
    headerBackgroundColor: '#f5f5f5',
    headerTextColor: '#5c5c5c',
    oddRowBackgroundColor: '#fafafa',
    rowHoverColor: 'rgba(124, 92, 255, 0.08)',
    pinnedColumnBorder: { style: 'solid', width: 1, color: '#c8c8c8' }
  })
};
