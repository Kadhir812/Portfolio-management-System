START TRANSACTION;

INSERT INTO security_details
    (asset_type, isin, symbol, series, name, description, exchange, currency, sector, industry, country, market, risk_level, status)
SELECT 'EQUITY', 'INE002A01018', 'RELIANCE', 'EQ', 'Reliance Industries Limited', 'Mock large-cap equity for moderately aggressive portfolios', 'NSE', 'INR', 'Energy', 'Integrated Oil and Gas', 'India', 'Indian Equity', 'HIGH', 'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM security_details WHERE isin = 'INE002A01018');

INSERT INTO security_details
    (asset_type, isin, symbol, series, name, description, exchange, currency, sector, industry, country, market, risk_level, status)
SELECT 'MUTUAL', 'INF090I01239', 'GROWWMID150', 'MF', 'Groww Mid Cap Fund', 'Mock mid-cap mutual fund for moderately aggressive portfolios', 'AMFI', 'INR', 'Financial Services', 'Mutual Funds', 'India', 'Indian Mutual Funds', 'HIGH', 'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM security_details WHERE isin = 'INF090I01239');

INSERT INTO security_details
    (asset_type, isin, symbol, series, name, description, exchange, currency, sector, industry, country, market, risk_level, status)
SELECT 'COMMODITY', NULL, 'GOLD-MOCK', NULL, 'Mock Gold Commodity', 'Mock gold commodity price instrument', 'MCX', 'INR', 'Commodities', 'Precious Metals', 'India', 'Commodity Market', 'MEDIUM', 'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM security_details WHERE symbol = 'GOLD-MOCK');

INSERT INTO security_details
    (asset_type, isin, symbol, series, name, description, exchange, currency, sector, industry, country, market, risk_level, status)
SELECT 'BOND', NULL, 'GSEC-2034-MOCK', NULL, 'Mock Government Security 2034', 'Mock sovereign bond for moderately aggressive portfolios', 'RBI', 'INR', 'Fixed Income', 'Government Bonds', 'India', 'Indian Debt Market', 'LOW', 'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM security_details WHERE symbol = 'GSEC-2034-MOCK');

INSERT INTO security_details
    (asset_type, isin, symbol, series, name, description, exchange, currency, sector, industry, country, market, risk_level, status)
SELECT 'CRYPTO', NULL, 'BTC-MOCK', NULL, 'Mock Bitcoin', 'Mock cryptocurrency price instrument', 'CRYPTO', 'USD', 'Digital Assets', 'Cryptocurrency', 'Global', 'Crypto Market', 'VERY_HIGH', 'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM security_details WHERE symbol = 'BTC-MOCK');

INSERT INTO security_details
    (asset_type, isin, symbol, series, name, description, exchange, currency, sector, industry, country, market, risk_level, status)
SELECT 'REIT', NULL, 'EMBASSY-REIT-MOCK', NULL, 'Mock Embassy Office Parks REIT', 'Mock listed real estate investment trust', 'NSE', 'INR', 'Real Estate', 'REIT', 'India', 'Indian REIT Market', 'MEDIUM', 'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM security_details WHERE symbol = 'EMBASSY-REIT-MOCK');

INSERT INTO security_details
    (asset_type, isin, symbol, series, name, description, exchange, currency, sector, industry, country, market, risk_level, status)
SELECT 'ETF', NULL, 'NIFTYBEES-MOCK', NULL, 'Mock Nifty 50 ETF', 'Mock exchange traded fund tracking the Nifty 50', 'NSE', 'INR', 'Diversified', 'Exchange Traded Fund', 'India', 'Indian ETF Market', 'HIGH', 'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM security_details WHERE symbol = 'NIFTYBEES-MOCK');

INSERT INTO security_details
    (asset_type, isin, symbol, series, name, description, exchange, currency, sector, industry, country, market, risk_level, status)
SELECT 'CASH', NULL, 'CASH-INR-MOCK', NULL, 'Indian Rupee Cash', 'Mock cash allocation for portfolio residuals', 'INTERNAL', 'INR', 'Cash', 'Cash Equivalent', 'India', 'Cash', 'LOW', 'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM security_details WHERE symbol = 'CASH-INR-MOCK');

INSERT INTO bond_details
    (security_id, issuer, issuer_type, bond_name, bond_type, face_value, issue_price, coupon_rate, coupon_type, coupon_frequency, issue_date, maturity_date, yield_to_maturity, credit_rating, rating_agency, callable, puttable, minimum_investment)
SELECT security_id, 'Government of India', 'Sovereign', 'Mock Government Security 2034', 'Government Bond', 100.000000, 100.000000, 7.100000, 'Fixed', 'Semi-Annual', '2024-01-01', '2034-01-01', 7.050000, 'AAA', 'Sovereign', FALSE, FALSE, 1000.000000
FROM security_details
WHERE symbol = 'GSEC-2034-MOCK'
  AND NOT EXISTS (SELECT 1 FROM bond_details b WHERE b.security_id = security_details.security_id);

INSERT INTO daily_prices
    (security_id, trade_date, open_price, high_price, low_price, close_price, prev_close, last_price, volume, nav, spot_price, valuation_price)
SELECT security_id, '2026-09-29', 1400.000000, 1435.000000, 1390.000000, 1420.000000, 1398.000000, 1418.000000, 1250000, NULL, NULL, 1420.000000
FROM security_details s
WHERE s.symbol = 'RELIANCE'
  AND NOT EXISTS (SELECT 1 FROM daily_prices p WHERE p.security_id = s.security_id AND p.trade_date = '2026-09-29');

INSERT INTO daily_prices
    (security_id, trade_date, open_price, high_price, low_price, close_price, prev_close, last_price, volume, nav, spot_price, valuation_price)
SELECT security_id, '2026-09-29', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 86.250000, NULL, 86.250000
FROM security_details s
WHERE s.symbol = 'GROWWMID150'
  AND NOT EXISTS (SELECT 1 FROM daily_prices p WHERE p.security_id = s.security_id AND p.trade_date = '2026-09-29');

INSERT INTO daily_prices
    (security_id, trade_date, open_price, high_price, low_price, close_price, prev_close, last_price, volume, nav, spot_price, valuation_price)
SELECT security_id, '2026-09-29', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 4500.000000, 4500.000000
FROM security_details s
WHERE s.symbol = 'GOLD-MOCK'
  AND NOT EXISTS (SELECT 1 FROM daily_prices p WHERE p.security_id = s.security_id AND p.trade_date = '2026-09-29');

INSERT INTO daily_prices
    (security_id, trade_date, open_price, high_price, low_price, close_price, prev_close, last_price, volume, nav, spot_price, valuation_price)
SELECT security_id, '2026-09-29', 100.000000, 100.500000, 99.750000, 100.100000, 100.000000, 100.100000, NULL, NULL, NULL, 100.100000
FROM security_details s
WHERE s.symbol = 'GSEC-2034-MOCK'
  AND NOT EXISTS (SELECT 1 FROM daily_prices p WHERE p.security_id = s.security_id AND p.trade_date = '2026-09-29');

INSERT INTO daily_prices
    (security_id, trade_date, open_price, high_price, low_price, close_price, prev_close, last_price, volume, nav, spot_price, valuation_price)
SELECT security_id, '2026-09-29', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 63500.000000, 63500.000000
FROM security_details s
WHERE s.symbol = 'BTC-MOCK'
  AND NOT EXISTS (SELECT 1 FROM daily_prices p WHERE p.security_id = s.security_id AND p.trade_date = '2026-09-29');

INSERT INTO daily_prices
    (security_id, trade_date, open_price, high_price, low_price, close_price, prev_close, last_price, volume, nav, spot_price, valuation_price)
SELECT security_id, '2026-09-29', 385.000000, 392.000000, 382.000000, 390.000000, 384.000000, 389.500000, 850000, NULL, NULL, 390.000000
FROM security_details s
WHERE s.symbol = 'EMBASSY-REIT-MOCK'
  AND NOT EXISTS (SELECT 1 FROM daily_prices p WHERE p.security_id = s.security_id AND p.trade_date = '2026-09-29');

INSERT INTO daily_prices
    (security_id, trade_date, open_price, high_price, low_price, close_price, prev_close, last_price, volume, nav, spot_price, valuation_price)
SELECT security_id, '2026-09-29', 255.000000, 258.000000, 253.000000, 257.000000, 254.500000, 256.800000, 420000, NULL, NULL, 257.000000
FROM security_details s
WHERE s.symbol = 'NIFTYBEES-MOCK'
  AND NOT EXISTS (SELECT 1 FROM daily_prices p WHERE p.security_id = s.security_id AND p.trade_date = '2026-09-29');

INSERT INTO daily_prices
    (security_id, trade_date, open_price, high_price, low_price, close_price, prev_close, last_price, volume, nav, spot_price, valuation_price)
SELECT security_id, '2026-09-29', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1.000000
FROM security_details s
WHERE s.symbol = 'CASH-INR-MOCK'
  AND NOT EXISTS (SELECT 1 FROM daily_prices p WHERE p.security_id = s.security_id AND p.trade_date = '2026-09-29');

COMMIT;
