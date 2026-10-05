# API integration reference

The API client is implemented in `src/api/client.js`. The default base URL is
`/api`, configurable with `VITE_API_URL`.

## Themes

| Operation | Method | Endpoint |
|---|---|---|
| List themes | GET | `/themes` |
| Get portfolio theme | GET | `/portfolios/{portfolioId}/theme` |
| Attach theme | PUT | `/portfolios/{portfolioId}/theme` |
| Remove theme | DELETE | `/portfolios/{portfolioId}/theme` |
| Update complete theme | PUT | `/themes/{theme}/definition` |
| Update legacy theme metadata | PUT | `/themes/{theme}` |
| Update legacy equity targets | PUT | `/themes/{theme}/equity-allocations` |

The frontend uses `/themes/{theme}/definition` for editor saves so metadata,
asset allocations, and equity allocations are persisted atomically.

## Asset-class master data

```http
GET /api/asset-classes
```

The response contains:

- `assetId`
- `assetClass`
- `assetDescription`
- `subAssetClass`
- `risk`
- `investmentHorizon`
- `subAssetDescription`

The frontend uses this data for labels, descriptions, tooltips, and
sub-asset-class display. The current backend has no explicit `active` flag;
records returned by the endpoint are treated as available. Deletion removes a
record from the endpoint response.

## Holdings

| Operation | Method | Endpoint |
|---|---|---|
| List holdings | GET | `/portfolios/{portfolioId}/holdings` |
| Add holding | POST | `/portfolios/{portfolioId}/holdings` |
| Update holding | PUT | `/portfolios/{portfolioId}/holdings/{holdingId}` |
| Remove holding | DELETE | `/portfolios/{portfolioId}/holdings/{holdingId}` |
| Save holdings | POST | `/portfolios/{portfolioId}/holdings/save` |
| Get summary | GET | `/portfolios/{portfolioId}/holdings/summary` |
| Get eligible securities | GET | `/portfolios/{portfolioId}/holdings/eligible-securities` |
| Get valuation | GET | `/portfolios/{portfolioId}/holdings/valuation` |
| Submit rebalance | POST | `/portfolios/{portfolioId}/holdings/rebalance` |

## Error behavior

The client converts API failures into user-visible errors and logs request
diagnostics. Unauthorized responses clear the local authentication state and
redirect to the login page.
## Asset-class naming

The backend uses `EQUITY` as the asset-class value. `STOCKS` is the
sub-asset-class value for equity securities. Frontend labels therefore show:

```text
Asset class: Equity
Sub-asset class: Stocks
```

For an existing database, run
`portfolio/src/main/resources/db/migrate_stocks_to_equity.sql` once before
starting the backend after this enum change.
