# Theme and allocation workflow

## User flow

The portfolio creation flow is:

```text
Portfolio Setup
  -> Theme Selection
  -> Attach Theme
  -> Holdings
  -> Save Holdings
  -> Portfolio Dashboard
```

The Theme Selection page is responsible for selecting and configuring a
theme. The Holdings page is the single place where securities and quantities
are added. There is no separate asset-allocation entry screen.

## Theme Selection

The theme list displays:

- Theme label
- Risk
- Investment horizon
- Description
- Asset-class target percentages
- Equity-category target percentages

The selected theme is attached to a portfolio with:

```http
PUT /api/portfolios/{portfolioId}/theme
```

## Editing a theme

Both the standalone Theme Editor and the embedded editor in the portfolio
creation flow use the same:

- Risk options: `Low`, `Moderate`, `High`, `Very High`
- Investment horizon options: `Short Term`, `Medium Term`, `Long Term`
- Required-field validation
- Asset-class percentage validation
- Equity-category validation
- Atomic update endpoint
- Error messages

The combined update endpoint is:

```http
PUT /api/themes/{theme}/definition
```

It updates theme metadata, asset-class allocations, and equity-category
allocations in one transaction.

### Validation rules

- Theme label, risk, and investment horizon are required.
- Asset-class percentages must be between `0` and `100`.
- Asset classes must be unique.
- Asset-class percentages must total `100%`.
- Exactly three unique equity categories are required.
- Equity-category percentages must be between `0` and `100`.
- Equity-category percentages must total the `EQUITY` allocation.

If validation fails, the complete update is rejected and the existing theme
configuration is preserved.

## Holdings and allocation

The Holdings page provides:

- Theme-compatible asset-class filtering
- Security search by name, symbol, ISIN, or sub-asset class
- Share quantity entry
- Estimated holding value
- Recommended shares for the remaining target
- Add, update, and remove holding actions
- Asset-class target summary
- Equity-category target summary
- Current versus target percentages
- Required amount for underweight allocations

The application does not require exact rupee matching. Prices, share
quantities, rounding, and market movement can prevent an exact match.

Holdings may remain partially allocated. The allocation summary shows the
remaining difference rather than blocking normal portfolio construction.

## Cash handling

Uninvested money is treated as residual cash:

```text
Residual cash = Portfolio amount - valued holdings
```

Cash is included in allocation summaries and dashboard composition. It is not
necessary to add a separate cash security for residual cash to be displayed.

## Guardrails

The frontend and backend prevent holdings from exceeding configured theme
targets. For stocks, equity-category targets are also checked. Differences
caused by price and quantity constraints are displayed as allocation drift.

Saving holdings requires at least one holding. It does not require exact
matching of every target allocation.
