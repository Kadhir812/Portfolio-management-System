# UI structure

Every table is an AG Grid built from `src/components/grid/`. Pages only declare columns.

```text
src/
  components/
    grid/        DataGrid (shared behaviour), GridCard (title + search + CSV), columns (builders + cell renderers), gridTheme
    charts/      NestedDonut (current ring outside, theme ring inside)
    theme/       ThemeEditor + theme columns, shared by Themes page and the portfolio wizard
    ui/          button, card, badge
    Layout, PageHeader, StatTile, Notice, AuthShell
  hooks/         useDashboardData, useBenchmarkPerformance, useHoldingsData  (loading and actions)
  lib/           format, allocation (limits and room left), dashboard, performance, rebalance  (pure maths)
  pages/
    DashboardPage + dashboard/       KPI tiles, Total assets card, allocation donut, grids, performance chart
    HoldingsPage  + holdings/        targets, add-securities grid, current-holdings grid
    CreatePortfolioPage + portfolio-form/
    Portfolios, Themes, Securities, Alerts, Rebalance, Login, Register
```

Change colours in `src/index.css` (and `gridTheme.js` for the grids). Turn on pagination for any grid with `pagination`.
