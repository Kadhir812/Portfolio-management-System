START TRANSACTION;

INSERT INTO security_details
    (asset_type, isin, symbol, series, name, description, exchange, currency, sector, industry, country, market, risk_level, status)
SELECT 'EQUITY', 'DEMO00000002', 'TCS-DRIFT-DEMO', 'EQ', 'Tata Consultancy Services Demo', 'Synthetic two-year drift demonstration price series', 'NSE', 'INR', 'Information Technology', 'IT Services', 'India', 'Indian Equity', 'HIGH', 'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM security_details WHERE symbol = 'TCS-DRIFT-DEMO');

INSERT INTO security_details
    (asset_type, isin, symbol, series, name, description, exchange, currency, sector, industry, country, market, risk_level, status)
SELECT 'EQUITY', 'DEMO00000003', 'INFY-DRIFT-DEMO', 'EQ', 'Infosys Demo', 'Synthetic two-year drift demonstration price series', 'NSE', 'INR', 'Information Technology', 'IT Services', 'India', 'Indian Equity', 'HIGH', 'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM security_details WHERE symbol = 'INFY-DRIFT-DEMO');

INSERT INTO security_details
    (asset_type, isin, symbol, series, name, description, exchange, currency, sector, industry, country, market, risk_level, status)
SELECT 'EQUITY', 'DEMO00000004', 'HEXAWARE-DRIFT-DEMO', 'EQ', 'Hexaware Technologies Demo', 'Synthetic two-year drift demonstration price series', 'NSE', 'INR', 'Information Technology', 'IT Services', 'India', 'Indian Equity', 'HIGH', 'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM security_details WHERE symbol = 'HEXAWARE-DRIFT-DEMO');

INSERT INTO security_details
    (asset_type, isin, symbol, series, name, description, exchange, currency, sector, industry, country, market, risk_level, status)
SELECT 'MUTUAL', 'DEMO00000005', 'MIDCAP-DRIFT-DEMO', 'MF', 'Midcap Mutual Fund Demo', 'Synthetic two-year drift demonstration price series', 'AMFI', 'INR', 'Financial Services', 'Mutual Funds', 'India', 'Indian Mutual Funds', 'HIGH', 'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM security_details WHERE symbol = 'MIDCAP-DRIFT-DEMO');

INSERT INTO security_details
    (asset_type, isin, symbol, series, name, description, exchange, currency, sector, industry, country, market, risk_level, status)
SELECT 'COMMODITY', NULL, 'GOLD-DRIFT-DEMO', NULL, 'Gold Commodity Demo', 'Synthetic two-year drift demonstration price series', 'MCX', 'INR', 'Commodities', 'Precious Metals', 'India', 'Commodity Market', 'MEDIUM', 'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM security_details WHERE symbol = 'GOLD-DRIFT-DEMO');

INSERT INTO security_details
    (asset_type, isin, symbol, series, name, description, exchange, currency, sector, industry, country, market, risk_level, status)
SELECT 'BOND', NULL, 'GSEC-DRIFT-DEMO', NULL, 'Government Bond Demo', 'Synthetic two-year drift demonstration price series', 'RBI', 'INR', 'Fixed Income', 'Government Bonds', 'India', 'Indian Debt Market', 'LOW', 'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM security_details WHERE symbol = 'GSEC-DRIFT-DEMO');

INSERT INTO security_details
    (asset_type, isin, symbol, series, name, description, exchange, currency, sector, industry, country, market, risk_level, status)
SELECT 'CRYPTO', NULL, 'ETH-DRIFT-DEMO', NULL, 'Ether Demo', 'Synthetic two-year drift demonstration price series', 'CRYPTO', 'INR', 'Digital Assets', 'Cryptocurrency', 'Global', 'Crypto Market', 'VERY_HIGH', 'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM security_details WHERE symbol = 'ETH-DRIFT-DEMO');

INSERT INTO security_details
    (asset_type, isin, symbol, series, name, description, exchange, currency, sector, industry, country, market, risk_level, status)
SELECT 'REIT', NULL, 'REIT-DRIFT-DEMO', NULL, 'Real Estate Investment Trust Demo', 'Synthetic two-year drift demonstration price series', 'NSE', 'INR', 'Real Estate', 'REIT', 'India', 'Indian REIT Market', 'MEDIUM', 'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM security_details WHERE symbol = 'REIT-DRIFT-DEMO');

INSERT INTO security_details
    (asset_type, isin, symbol, series, name, description, exchange, currency, sector, industry, country, market, risk_level, status)
SELECT 'ETF', NULL, 'ETF-DRIFT-DEMO', NULL, 'Broad Market ETF Demo', 'Synthetic two-year drift demonstration price series', 'NSE', 'INR', 'Diversified', 'Exchange Traded Fund', 'India', 'Indian ETF Market', 'HIGH', 'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM security_details WHERE symbol = 'ETF-DRIFT-DEMO');

DELETE p
FROM daily_prices p
JOIN security_details s ON s.security_id = p.security_id
WHERE s.symbol IN (
    'TCS-DRIFT-DEMO', 'INFY-DRIFT-DEMO', 'HEXAWARE-DRIFT-DEMO', 'MIDCAP-DRIFT-DEMO',
    'GOLD-DRIFT-DEMO', 'GSEC-DRIFT-DEMO', 'ETH-DRIFT-DEMO', 'REIT-DRIFT-DEMO', 'ETF-DRIFT-DEMO'
)
  AND p.trade_date BETWEEN '2024-09-29' AND '2026-09-29';

INSERT INTO daily_prices (security_id, trade_date, close_price, valuation_price)
SELECT s.security_id,
       DATE_ADD('2024-09-29', INTERVAL offsets.month_offset MONTH),
       CAST(positions.start_price
            + positions.total_gain * offsets.month_offset / 24
            + positions.swing * SIN(offsets.month_offset * PI() / 6) AS DECIMAL(20, 6)),
       CAST(positions.start_price
            + positions.total_gain * offsets.month_offset / 24
            + positions.swing * SIN(offsets.month_offset * PI() / 6) AS DECIMAL(20, 6))
FROM (
    SELECT 'TCS-DRIFT-DEMO' AS symbol, 1000.0 AS start_price, 500.0 AS total_gain, 45.0 AS swing
    UNION ALL SELECT 'INFY-DRIFT-DEMO', 1000.0, 360.0, 35.0
    UNION ALL SELECT 'HEXAWARE-DRIFT-DEMO', 1000.0, 700.0, 70.0
    UNION ALL SELECT 'MIDCAP-DRIFT-DEMO', 86.25, 30.1875, 5.0
    UNION ALL SELECT 'GOLD-DRIFT-DEMO', 4500.0, 900.0, 180.0
    UNION ALL SELECT 'GSEC-DRIFT-DEMO', 100.0, 8.0, 1.5
    UNION ALL SELECT 'ETH-DRIFT-DEMO', 1000.0, 800.0, 250.0
    UNION ALL SELECT 'REIT-DRIFT-DEMO', 100.0, 15.0, 3.0
    UNION ALL SELECT 'ETF-DRIFT-DEMO', 100.0, 25.0, 4.0
) positions
JOIN security_details s ON s.symbol = positions.symbol
CROSS JOIN (
    SELECT 0 AS month_offset UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3
    UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7
    UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11
    UNION ALL SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14 UNION ALL SELECT 15
    UNION ALL SELECT 16 UNION ALL SELECT 17 UNION ALL SELECT 18 UNION ALL SELECT 19
    UNION ALL SELECT 20 UNION ALL SELECT 21 UNION ALL SELECT 22 UNION ALL SELECT 23
    UNION ALL SELECT 24
) offsets;

COMMIT;