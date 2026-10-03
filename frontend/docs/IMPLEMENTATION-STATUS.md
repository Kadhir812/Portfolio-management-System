# Implementation status

## Completed

- Portfolio setup and editing flow
- Theme selection and portfolio theme attachment
- Theme metadata editing
- Asset-class allocation editing
- Equity-category allocation editing
- Atomic theme configuration updates
- Shared theme editor options and validation
- Dynamic asset-class master-data loading
- Master-data labels, descriptions, and sub-asset-class display
- Security search and theme-compatible filtering
- Add, update, and remove holdings
- Asset-class and equity-category target guardrails
- Residual cash calculation
- Allocation summary and target differences
- Holdings save lifecycle and initial trade creation
- Historical valuation and dashboard allocation drift
- Benchmark comparison
- Portfolio close behavior

## Deliberate behavior

- Holdings do not need to match every target amount exactly.
- Residual uninvested money is treated as cash.
- Small differences caused by price and share quantity constraints are
  displayed rather than treated as errors.
- Holdings can be saved while allocation is incomplete.
- The Holdings page, not the portfolio creation page, is the allocation entry
  surface.

## Remaining considerations

- The asset-class master model does not currently expose an `active` flag.
- The rebalance UI primarily proposes sells; complete buy-and-sell simulation
  may be added later.
- The legacy theme update endpoints remain for compatibility. New editor saves
  use the atomic definition endpoint.
- Automated coverage should be expanded for atomic rollback, cash edge cases,
  theme changes affecting existing portfolios, and rebalance calculations.
