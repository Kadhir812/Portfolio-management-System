START TRANSACTION;

INSERT IGNORE INTO security_details (asset_type, isin, symbol, series, name, description, exchange, currency, sector, industry, country, market, risk_level, status) VALUES
('EQUITY', 'INE002A01026', 'TCS-MOCK', 'EQ', 'Tata Consultancy Services Mock', 'Mock equity security', 'NSE', 'INR', 'Information Technology', 'IT Services', 'India', 'Indian Equity', 'HIGH', 'ACTIVE'),
('EQUITY', 'INE009A01021', 'INFY-MOCK', 'EQ', 'Infosys Mock', 'Mock equity security', 'NSE', 'INR', 'Information Technology', 'IT Services', 'India', 'Indian Equity', 'HIGH', 'ACTIVE'),
('EQUITY', 'INE040A01034', 'HDFCBANK-MOCK', 'EQ', 'HDFC Bank Mock', 'Mock equity security', 'NSE', 'INR', 'Financial Services', 'Banks', 'India', 'Indian Equity', 'HIGH', 'ACTIVE'),
('EQUITY', 'INE018A01030', 'ITC-MOCK', 'EQ', 'ITC Mock', 'Mock equity security', 'NSE', 'INR', 'Consumer Goods', 'Tobacco and FMCG', 'India', 'Indian Equity', 'MEDIUM', 'ACTIVE'),
('MUTUAL', 'INF109K01Z99', 'MIRAE-MOCK', 'MF', 'Mirae Asset Equity Fund Mock', 'Mock mutual fund security', 'AMFI', 'INR', 'Financial Services', 'Mutual Funds', 'India', 'Indian Mutual Funds', 'HIGH', 'ACTIVE'),
('MUTUAL', 'INF200K01AA1', 'SBI-MIDCAP-MOCK', 'MF', 'SBI Midcap Fund Mock', 'Mock mutual fund security', 'AMFI', 'INR', 'Financial Services', 'Mutual Funds', 'India', 'Indian Mutual Funds', 'HIGH', 'ACTIVE'),
('MUTUAL', 'INF740K01BB2', 'AXIS-GROWTH-MOCK', 'MF', 'Axis Growth Fund Mock', 'Mock mutual fund security', 'AMFI', 'INR', 'Financial Services', 'Mutual Funds', 'India', 'Indian Mutual Funds', 'HIGH', 'ACTIVE'),
('MUTUAL', 'INF846K01CC3', 'ICICI-EQUITY-MOCK', 'MF', 'ICICI Equity Fund Mock', 'Mock mutual fund security', 'AMFI', 'INR', 'Financial Services', 'Mutual Funds', 'India', 'Indian Mutual Funds', 'HIGH', 'ACTIVE'),
('COMMODITY', NULL, 'SILVER-MOCK', NULL, 'Mock Silver Commodity', 'Mock commodity security', 'MCX', 'INR', 'Commodities', 'Precious Metals', 'India', 'Commodity Market', 'HIGH', 'ACTIVE'),
('COMMODITY', NULL, 'COPPER-MOCK', NULL, 'Mock Copper Commodity', 'Mock commodity security', 'MCX', 'INR', 'Commodities', 'Industrial Metals', 'India', 'Commodity Market', 'HIGH', 'ACTIVE'),
('COMMODITY', NULL, 'CRUDE-OIL-MOCK', NULL, 'Mock Crude Oil Commodity', 'Mock commodity security', 'MCX', 'INR', 'Commodities', 'Energy', 'India', 'Commodity Market', 'HIGH', 'ACTIVE'),
('COMMODITY', NULL, 'NATURAL-GAS-MOCK', NULL, 'Mock Natural Gas Commodity', 'Mock commodity security', 'MCX', 'INR', 'Commodities', 'Energy', 'India', 'Commodity Market', 'HIGH', 'ACTIVE'),
('BOND', NULL, 'GSEC-2029-MOCK', NULL, 'Mock Government Security 2029', 'Mock bond security', 'RBI', 'INR', 'Fixed Income', 'Government Bonds', 'India', 'Indian Debt Market', 'LOW', 'ACTIVE'),
('BOND', NULL, 'GSEC-2031-MOCK', NULL, 'Mock Government Security 2031', 'Mock bond security', 'RBI', 'INR', 'Fixed Income', 'Government Bonds', 'India', 'Indian Debt Market', 'LOW', 'ACTIVE'),
('BOND', NULL, 'NHAI-2032-MOCK', NULL, 'Mock NHAI Bond 2032', 'Mock bond security', 'NSE', 'INR', 'Fixed Income', 'Corporate Bonds', 'India', 'Indian Debt Market', 'MEDIUM', 'ACTIVE'),
('BOND', NULL, 'REC-2033-MOCK', NULL, 'Mock REC Bond 2033', 'Mock bond security', 'NSE', 'INR', 'Fixed Income', 'Corporate Bonds', 'India', 'Indian Debt Market', 'MEDIUM', 'ACTIVE'),
('CRYPTO', NULL, 'ETH-MOCK', NULL, 'Mock Ethereum', 'Mock crypto security', 'CRYPTO', 'USD', 'Digital Assets', 'Cryptocurrency', 'Global', 'Crypto Market', 'VERY_HIGH', 'ACTIVE'),
('CRYPTO', NULL, 'SOL-MOCK', NULL, 'Mock Solana', 'Mock crypto security', 'CRYPTO', 'USD', 'Digital Assets', 'Cryptocurrency', 'Global', 'Crypto Market', 'VERY_HIGH', 'ACTIVE'),
('CRYPTO', NULL, 'ADA-MOCK', NULL, 'Mock Cardano', 'Mock crypto security', 'CRYPTO', 'USD', 'Digital Assets', 'Cryptocurrency', 'Global', 'Crypto Market', 'VERY_HIGH', 'ACTIVE'),
('CRYPTO', NULL, 'XRP-MOCK', NULL, 'Mock XRP', 'Mock crypto security', 'CRYPTO', 'USD', 'Digital Assets', 'Cryptocurrency', 'Global', 'Crypto Market', 'VERY_HIGH', 'ACTIVE'),
('REIT', NULL, 'MINDSPACE-REIT-MOCK', NULL, 'Mock Mindspace REIT', 'Mock REIT security', 'NSE', 'INR', 'Real Estate', 'REIT', 'India', 'Indian REIT Market', 'MEDIUM', 'ACTIVE'),
('REIT', NULL, 'BROOKFIELD-REIT-MOCK', NULL, 'Mock Brookfield REIT', 'Mock REIT security', 'NSE', 'INR', 'Real Estate', 'REIT', 'India', 'Indian REIT Market', 'MEDIUM', 'ACTIVE'),
('REIT', NULL, 'NEXUS-REIT-MOCK', NULL, 'Mock Nexus Select REIT', 'Mock REIT security', 'NSE', 'INR', 'Real Estate', 'REIT', 'India', 'Indian REIT Market', 'MEDIUM', 'ACTIVE'),
('REIT', NULL, 'SREI-REIT-MOCK', NULL, 'Mock SREI REIT', 'Mock REIT security', 'NSE', 'INR', 'Real Estate', 'REIT', 'India', 'Indian REIT Market', 'MEDIUM', 'ACTIVE'),
('ETF', NULL, 'BANKBEES-MOCK', NULL, 'Mock Bank ETF', 'Mock ETF security', 'NSE', 'INR', 'Financial Services', 'Exchange Traded Fund', 'India', 'Indian ETF Market', 'HIGH', 'ACTIVE'),
('ETF', NULL, 'ITBEES-MOCK', NULL, 'Mock IT ETF', 'Mock ETF security', 'NSE', 'INR', 'Information Technology', 'Exchange Traded Fund', 'India', 'Indian ETF Market', 'HIGH', 'ACTIVE'),
('ETF', NULL, 'JUNIORBEES-MOCK', NULL, 'Mock Next 50 ETF', 'Mock ETF security', 'NSE', 'INR', 'Diversified', 'Exchange Traded Fund', 'India', 'Indian ETF Market', 'HIGH', 'ACTIVE'),
('ETF', NULL, 'GOLDBEES-MOCK', NULL, 'Mock Gold ETF', 'Mock ETF security', 'NSE', 'INR', 'Commodities', 'Exchange Traded Fund', 'India', 'Indian ETF Market', 'HIGH', 'ACTIVE'),
('CASH', NULL, 'CASH-USD-MOCK', NULL, 'US Dollar Cash Mock', 'Mock cash security', 'INTERNAL', 'USD', 'Cash', 'Cash Equivalent', 'United States', 'Cash', 'LOW', 'ACTIVE'),
('CASH', NULL, 'CASH-GBP-MOCK', NULL, 'British Pound Cash Mock', 'Mock cash security', 'INTERNAL', 'GBP', 'Cash', 'Cash Equivalent', 'United Kingdom', 'Cash', 'LOW', 'ACTIVE'),
('CASH', NULL, 'CASH-EUR-MOCK', NULL, 'Euro Cash Mock', 'Mock cash security', 'INTERNAL', 'EUR', 'Cash', 'Cash Equivalent', 'European Union', 'Cash', 'LOW', 'ACTIVE'),
('CASH', NULL, 'CASH-SGD-MOCK', NULL, 'Singapore Dollar Cash Mock', 'Mock cash security', 'INTERNAL', 'SGD', 'Cash', 'Cash Equivalent', 'Singapore', 'Cash', 'LOW', 'ACTIVE');

INSERT INTO daily_prices (security_id, trade_date, valuation_price, nav, spot_price, close_price)
SELECT security_id, '2026-09-29',
    CASE asset_type WHEN 'EQUITY' THEN 1000.000000 WHEN 'MUTUAL' THEN 100.000000 WHEN 'COMMODITY' THEN 4500.000000 WHEN 'BOND' THEN 100.000000 WHEN 'CRYPTO' THEN 1000.000000 WHEN 'REIT' THEN 100.000000 WHEN 'ETF' THEN 100.000000 ELSE 1.000000 END,
    CASE WHEN asset_type = 'MUTUAL' THEN 100.000000 END,
    CASE WHEN asset_type = 'COMMODITY' THEN 4500.000000 END,
    CASE WHEN asset_type IN ('EQUITY', 'BOND', 'REIT', 'ETF') THEN 100.000000 END
FROM security_details s
WHERE s.symbol LIKE '%-MOCK'
  AND s.symbol NOT IN ('RELIANCE', 'GROWWMID150', 'GOLD-MOCK', 'GSEC-2034-MOCK', 'BTC-MOCK', 'EMBASSY-REIT-MOCK', 'NIFTYBEES-MOCK', 'CASH-INR-MOCK')
  AND NOT EXISTS (SELECT 1 FROM daily_prices p WHERE p.security_id = s.security_id AND p.trade_date = '2026-09-29');

INSERT INTO bond_details (security_id, issuer, issuer_type, bond_name, bond_type, face_value, issue_price, coupon_rate, coupon_type, coupon_frequency, issue_date, maturity_date, yield_to_maturity, credit_rating, rating_agency, callable, puttable, minimum_investment)
SELECT s.security_id, 'Mock Issuer', 'Sovereign', s.name, 'Government Bond', 100.000000, 100.000000, 7.000000, 'Fixed', 'Annual', '2024-01-01', '2034-01-01', 7.000000, 'AAA', 'Sovereign', FALSE, FALSE, 1000.000000
FROM security_details s
WHERE s.asset_type = 'BOND' AND s.symbol <> 'GSEC-2034-MOCK'
  AND NOT EXISTS (SELECT 1 FROM bond_details b WHERE b.security_id = s.security_id);

COMMIT;
