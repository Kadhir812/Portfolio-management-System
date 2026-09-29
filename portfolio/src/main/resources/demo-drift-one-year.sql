START TRANSACTION;

INSERT INTO security_details
    (asset_type, isin, symbol, series, name, description, exchange, currency, sector, industry, country, market, risk_level, status)
SELECT 'EQUITY', 'DEMO00000002', 'TCS-DRIFT-DEMO', 'EQ', 'Tata Consultancy Services Demo', 'Synthetic one-year drift demonstration price series', 'NSE', 'INR', 'Information Technology', 'IT Services', 'India', 'Indian Equity', 'HIGH', 'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM security_details WHERE symbol = 'TCS-DRIFT-DEMO');

INSERT INTO security_details
    (asset_type, isin, symbol, series, name, description, exchange, currency, sector, industry, country, market, risk_level, status)
SELECT 'EQUITY', 'DEMO00000003', 'INFY-DRIFT-DEMO', 'EQ', 'Infosys Demo', 'Synthetic one-year drift demonstration price series', 'NSE', 'INR', 'Information Technology', 'IT Services', 'India', 'Indian Equity', 'HIGH', 'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM security_details WHERE symbol = 'INFY-DRIFT-DEMO');

INSERT INTO security_details
    (asset_type, isin, symbol, series, name, description, exchange, currency, sector, industry, country, market, risk_level, status)
SELECT 'EQUITY', 'DEMO00000004', 'HEXAWARE-DRIFT-DEMO', 'EQ', 'Hexaware Technologies Demo', 'Synthetic one-year drift demonstration price series', 'NSE', 'INR', 'Information Technology', 'IT Services', 'India', 'Indian Equity', 'HIGH', 'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM security_details WHERE symbol = 'HEXAWARE-DRIFT-DEMO');

INSERT INTO daily_prices (security_id, trade_date, close_price, valuation_price)
SELECT s.security_id,
       DATE_ADD('2025-09-29', INTERVAL offsets.month_offset MONTH),
       CAST(1000 + (positions.total_gain * offsets.month_offset / 12) AS DECIMAL(20, 6)),
       CAST(1000 + (positions.total_gain * offsets.month_offset / 12) AS DECIMAL(20, 6))
FROM (
    SELECT 'TCS-DRIFT-DEMO' AS symbol, 120.0 AS total_gain
    UNION ALL SELECT 'INFY-DRIFT-DEMO', 100.0
    UNION ALL SELECT 'HEXAWARE-DRIFT-DEMO', 150.0
) positions
JOIN security_details s ON s.symbol = positions.symbol
CROSS JOIN (
    SELECT 0 AS month_offset UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3
    UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7
    UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11
    UNION ALL SELECT 12
) offsets
WHERE NOT EXISTS (
        SELECT 1 FROM daily_prices p
        WHERE p.security_id = s.security_id
            AND p.trade_date = DATE_ADD('2025-09-29', INTERVAL offsets.month_offset MONTH)
);

INSERT INTO daily_prices (security_id, trade_date, close_price, valuation_price)
SELECT s.security_id,
       DATE_ADD('2025-09-29', INTERVAL offsets.month_offset MONTH),
       CASE s.symbol
           WHEN 'GROWWMID150' THEN 86.25
           WHEN 'GOLD-MOCK' THEN 4500
           WHEN 'GSEC-2029-MOCK' THEN 100
           WHEN 'ETH-MOCK' THEN 1000
           WHEN 'BROOKFIELD-REIT-MOCK' THEN 100
           WHEN 'GOLDBEES-MOCK' THEN 100
       END,
       CASE s.symbol
           WHEN 'GROWWMID150' THEN 86.25
           WHEN 'GOLD-MOCK' THEN 4500
           WHEN 'GSEC-2029-MOCK' THEN 100
           WHEN 'ETH-MOCK' THEN 1000
           WHEN 'BROOKFIELD-REIT-MOCK' THEN 100
           WHEN 'GOLDBEES-MOCK' THEN 100
       END
FROM security_details s
CROSS JOIN (
    SELECT 0 AS month_offset UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3
    UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7
    UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11
    UNION ALL SELECT 12
) offsets
WHERE s.symbol IN (
    'GROWWMID150', 'GOLD-MOCK', 'GSEC-2029-MOCK', 'ETH-MOCK',
    'BROOKFIELD-REIT-MOCK', 'GOLDBEES-MOCK'
)
  AND NOT EXISTS (
      SELECT 1 FROM daily_prices p
      WHERE p.security_id = s.security_id
        AND p.trade_date = DATE_ADD('2025-09-29', INTERVAL offsets.month_offset MONTH)
  );

COMMIT;
