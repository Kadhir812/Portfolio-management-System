START TRANSACTION;

SET @demo_portfolio_id = (
    SELECT id
    FROM portfolios
    WHERE name IN ('Drift Rebalance Demo - 1Y', 'Drift Rebalance Demo - 2Y')
    ORDER BY id DESC
    LIMIT 1
);

UPDATE portfolios
SET name = 'Drift Rebalance Demo - 2Y', purchase_date = '2024-09-29', theme = 'AGGRESSIVE', holdings_saved = TRUE
WHERE id = @demo_portfolio_id;

DELETE h FROM portfolio_holdings h
WHERE h.portfolio_id = @demo_portfolio_id;

DELETE FROM portfolio_trades WHERE portfolio_id = @demo_portfolio_id;

INSERT INTO portfolio_trades
    (portfolio_id, security_id, isin, symbol, security_name, asset_class, signed_shares, unit_price, trade_date, created_at)
SELECT @demo_portfolio_id, s.security_id, s.isin, s.symbol, s.name, positions.asset_class,
       positions.shares, positions.unit_price, '2025-09-29', CURRENT_TIMESTAMP(6)
FROM (
    SELECT 'TCS-DRIFT-DEMO' AS symbol, 'STOCKS' AS asset_class, 200.00000000 AS shares, 1000.000000 AS unit_price
    UNION ALL SELECT 'INFY-DRIFT-DEMO', 'STOCKS', 150.00000000, 1000.000000
    UNION ALL SELECT 'HEXAWARE-DRIFT-DEMO', 'STOCKS', 100.00000000, 1000.000000
    UNION ALL SELECT 'MIDCAP-DRIFT-DEMO', 'MUTUAL_FUNDS', 1739.13043478, 86.250000
    UNION ALL SELECT 'GOLD-DRIFT-DEMO', 'COMMODITIES', 11.11111111, 4500.000000
    UNION ALL SELECT 'GSEC-DRIFT-DEMO', 'BONDS', 1000.00000000, 100.000000
    UNION ALL SELECT 'ETH-DRIFT-DEMO', 'CRYPTO', 100.00000000, 1000.000000
    UNION ALL SELECT 'REIT-DRIFT-DEMO', 'REITS', 500.00000000, 100.000000
    UNION ALL SELECT 'ETF-DRIFT-DEMO', 'ETFS', 500.00000000, 100.000000
) positions
JOIN security_details s ON s.symbol = positions.symbol
WHERE NOT EXISTS (
    SELECT 1 FROM portfolio_trades t
    WHERE t.portfolio_id = @demo_portfolio_id
      AND t.security_id = s.security_id
      AND t.trade_date = '2025-09-29'
);

INSERT INTO portfolio_holdings
    (portfolio_id, security_id, isin, security_name, symbol, asset_class, shares, price, value, price_date, created_at, updated_at)
SELECT @demo_portfolio_id, s.security_id, s.isin, s.name, s.symbol, positions.asset_class,
       positions.shares, p.valuation_price, positions.shares * p.valuation_price,
       p.trade_date, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
FROM (
    SELECT 'TCS-DRIFT-DEMO' AS symbol, 'STOCKS' AS asset_class, 200.00000000 AS shares
    UNION ALL SELECT 'INFY-DRIFT-DEMO', 'STOCKS', 150.00000000
    UNION ALL SELECT 'HEXAWARE-DRIFT-DEMO', 'STOCKS', 100.00000000
    UNION ALL SELECT 'MIDCAP-DRIFT-DEMO', 'MUTUAL_FUNDS', 1739.13043478
    UNION ALL SELECT 'GOLD-DRIFT-DEMO', 'COMMODITIES', 11.11111111
    UNION ALL SELECT 'GSEC-DRIFT-DEMO', 'BONDS', 1000.00000000
    UNION ALL SELECT 'ETH-DRIFT-DEMO', 'CRYPTO', 100.00000000
    UNION ALL SELECT 'REIT-DRIFT-DEMO', 'REITS', 500.00000000
    UNION ALL SELECT 'ETF-DRIFT-DEMO', 'ETFS', 500.00000000
) positions
JOIN security_details s ON s.symbol = positions.symbol
JOIN daily_prices p ON p.security_id = s.security_id AND p.trade_date = '2026-09-29'
WHERE NOT EXISTS (
    SELECT 1 FROM portfolio_holdings h
    WHERE h.portfolio_id = @demo_portfolio_id AND h.security_id = s.security_id
);

COMMIT;