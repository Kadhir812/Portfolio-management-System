Use this process to test dashboard performance before adding Redis.

## 1. Start the backend

```powershell
Set-Location "C:\New folder\Portfolio-management-System\portfolio"
.\mvnw.cmd spring-boot:run
```

Backend URL:

```text
http://localhost:8081
```

## 2. Authenticate

Login:

```text
POST http://localhost:8081/api/auth/login
```

Body:

```json
{
  "username": "your-username",
  "password": "your-password"
}
```

PowerShell:

```powershell
$loginBody = @{
    username = "your-username"
    password = "your-password"
} | ConvertTo-Json

$login = Invoke-RestMethod `
    -Method Post `
    -Uri "http://localhost:8081/api/auth/login" `
    -ContentType "application/json" `
    -Body $loginBody

$headers = @{
    Authorization = "Bearer $($login.token)"
}
```

Do not print or share the token.

## 3. Find a portfolio ID

```text
GET /api/portfolios
```

```powershell
$portfolios = Invoke-RestMethod `
    -Method Get `
    -Uri "http://localhost:8081/api/portfolios" `
    -Headers $headers

$portfolios | Format-Table
```

Set an existing ID:

```powershell
$portfolioId = 22
```

Replace `22` with an ID returned by your database.

## 4. Dashboard endpoints to test

These are the main dashboard/read endpoints:

| Purpose | Method | Endpoint |
|---|---|---|
| Portfolio list | GET | `/api/portfolios` |
| Portfolio details | GET | `/api/portfolios/{portfolioId}` |
| Holdings | GET | `/api/portfolios/{portfolioId}/holdings` |
| Holdings summary | GET | `/api/portfolios/{portfolioId}/holdings/summary` |
| Current valuation | GET | `/api/portfolios/{portfolioId}/holdings/valuation?date=2026-10-05` |
| Eligible securities | GET | `/api/portfolios/{portfolioId}/holdings/eligible-securities?date=2026-10-05` |
| Portfolio theme | GET | `/api/portfolios/{portfolioId}/theme` |
| Available themes | GET | `/api/themes` |
| Asset classes | GET | `/api/asset-classes` |
| Security list | GET | `/api/securities` |
| Security search | GET | `/api/securities/search?query=equity` |

For the main dashboard, prioritize these four:

```text
GET /api/portfolios/{portfolioId}
GET /api/portfolios/{portfolioId}/holdings
GET /api/portfolios/{portfolioId}/holdings/summary
GET /api/portfolios/{portfolioId}/holdings/valuation?date=2026-10-05
```

For the rebalance page, also test:

```text
GET /api/portfolios/{portfolioId}/holdings/eligible-securities?date=2026-10-05
GET /api/portfolios/{portfolioId}/theme
```

## 5. Measure one endpoint

```powershell
$uri = "http://localhost:8081/api/portfolios/$portfolioId/holdings/valuation?date=2026-10-05"

$duration = Measure-Command {
    Invoke-RestMethod `
        -Method Get `
        -Uri $uri `
        -Headers $headers `
        | Out-Null
}

Write-Host "Response time: $([math]::Round($duration.TotalMilliseconds, 2)) ms"
```

A single request is not enough because the first request may include application or database startup overhead.

## 6. Measure average and p95 latency

```powershell
$endpoints = @(
    "/api/portfolios",
    "/api/portfolios/$portfolioId",
    "/api/portfolios/$portfolioId/holdings",
    "/api/portfolios/$portfolioId/holdings/summary",
    "/api/portfolios/$portfolioId/holdings/valuation?date=2026-10-05",
    "/api/portfolios/$portfolioId/holdings/eligible-securities?date=2026-10-05",
    "/api/portfolios/$portfolioId/theme"
)

foreach ($endpoint in $endpoints) {
    $uri = "http://localhost:8081$endpoint"
    $times = @()
    $errors = 0

    # Warm-up
    try {
        Invoke-RestMethod -Method Get -Uri $uri -Headers $headers | Out-Null
    }
    catch {
        $errors++
    }

    1..20 | ForEach-Object {
        try {
            $duration = Measure-Command {
                Invoke-RestMethod `
                    -Method Get `
                    -Uri $uri `
                    -Headers $headers `
                    | Out-Null
            }

            $times += [math]::Round($duration.TotalMilliseconds, 2)
        }
        catch {
            $errors++
        }
    }

    if ($times.Count -gt 0) {
        $sorted = $times | Sort-Object
        $average = ($times | Measure-Object -Average).Average
        $p95Index = [math]::Ceiling($sorted.Count * 0.95) - 1
        $p95 = $sorted[$p95Index]

        Write-Host ""
        Write-Host $endpoint
        Write-Host "Average: $([math]::Round($average, 2)) ms"
        Write-Host "p95: $p95 ms"
        Write-Host "Maximum: $($sorted[-1]) ms"
        Write-Host "Errors: $errors"
    }
}
```

Your acceptance target should be:

```text
p95 < 2000 ms
Errors = 0
```

Use p95 rather than only the average. An average below two seconds can still hide slow requests.

## 7. Inspect requests in the browser

1. Open the dashboard.
2. Press `F12`.
3. Open **Network**.
4. Select **Fetch/XHR**.
5. Reload the dashboard.
6. Record the `Time` value for each `/api` request.
7. Look for:
   - Requests above 2 seconds.
   - The same endpoint called multiple times.
   - Sequential requests that could run in parallel.
   - Large response payloads.

## 8. Enable SQL logging locally

In `application.properties`, temporarily use:

```properties
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
logging.level.org.hibernate.SQL=DEBUG
logging.level.org.hibernate.orm.jdbc.bind=TRACE
```

Restart the backend and call the slow endpoint.

Look for:

- The same query executed repeatedly.
- One query per holding or security.
- Full table scans.
- Repeated price lookups.
- Queries returning more rows than needed.

Do not enable bind-value logging in production because values may contain sensitive information.

## 9. Inspect database indexes

In MySQL:

```sql
SHOW INDEX FROM portfolio_holdings;
SHOW INDEX FROM portfolio_trades;
SHOW INDEX FROM daily_price;
SHOW INDEX FROM security_details;
```

Use the actual table names from your schema if they differ.

For a slow query, run:

```sql
EXPLAIN
SELECT ...;
```

Look for:

- `type = ALL`
- High `rows` values
- Missing indexes
- Temporary tables
- Filesort
- Inefficient joins

## 10. Decide what to optimize

| Finding | Likely action |
|---|---|
| SQL takes most of the time | Add a targeted index or improve the query |
| Many similar SQL statements | Fix N+1 loading |
| Large response payload | Use DTO projections or pagination |
| Several duplicate frontend calls | Remove duplicate requests |
| Java calculation is slow | Optimize service logic |
| Stable reference data is repeatedly requested | Consider Redis later |
| Valuation/cash/drift is stale after caching | Do not cache it blindly |

Do not test rebalance repeatedly as part of read-latency testing because it changes portfolio data. Measure the `POST /holdings/rebalance` endpoint separately with controlled test data and CSRF headers.

The correct order is:

```text
Measure dashboard APIs
→ Identify slow endpoint
→ Inspect its SQL
→ Optimize query/index/code
→ Measure again
→ Add Redis only if the measured bottleneck remains
```