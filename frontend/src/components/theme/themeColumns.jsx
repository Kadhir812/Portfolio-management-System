import { Pill, textCol } from '../grid/columns';
import { formatAssetClass } from '../../lib/assetClassUtils';

const RISK_TONE = { Low: 'good', Moderate: 'info', High: 'warn', 'Very High': 'bad' };
const RISK_ORDER = { Low: 0, Moderate: 1, High: 2, 'Very High': 3 };

/** Columns for a list of themes. Shared by the Themes page and the portfolio wizard. */
export const themeColumns = (assetClassMetadata = {}) => [
  textCol('label', 'Theme', {
    sort: undefined,
    cellClass: 'font-semibold',
    width: 240,
    // order by how risky the theme is, not alphabetically
    comparator: (_a, _b, nodeA, nodeB) => (RISK_ORDER[nodeA.data.risk] ?? 9) - (RISK_ORDER[nodeB.data.risk] ?? 9)
  }),
  textCol('risk', 'Risk', {
    minWidth: 130,
    comparator: (a, b) => (RISK_ORDER[a] ?? 9) - (RISK_ORDER[b] ?? 9),
    cellRenderer: ({ value }) => <Pill tone={RISK_TONE[value] || 'neutral'}>{value}</Pill>
  }),
  textCol('investmentHorizon', 'Horizon', { minWidth: 140 }),
  {
    headerName: 'Asset allocation',
    field: 'allocations',
    minWidth: 380,
    flex: 2,
    sortable: false,
    filter: 'agTextColumnFilter',
    filterValueGetter: ({ data }) => data.allocations.map((a) => formatAssetClass(a.assetClass, assetClassMetadata)).join(' '),
    valueFormatter: ({ value }) => (value || []).map((a) => `${formatAssetClass(a.assetClass, assetClassMetadata)} ${a.percentage}%`).join('  ·  ')
  },
  {
    headerName: 'Equity split',
    field: 'equityAllocations',
    minWidth: 260,
    sortable: false,
    filter: false,
    valueFormatter: ({ value }) => (value || []).map((a) => `${a.equityCategory.split('_')[0][0]}${a.equityCategory.split('_')[0].slice(1).toLowerCase()} ${a.percentage}%`).join('  ·  ') || '—'
  }
];
