-- Portfolio seed: 25 linked securities and weekday prices for 2026-01-01 through 2026-10-02.
-- The prices are deterministic synthetic demo data, not verified market history.
-- MySQL 8+.
USE portfolio_db;

START TRANSACTION;

INSERT INTO asset_class_master
    (asset_class, asset_description, sub_asset_class, risk, investment_horizon, sub_asset_description)
VALUES
    ('EQUITY',      'Equity', 'STOCKS', 'HIGH', 'LONG', 'Stocks listed on public exchanges'),
    ('MUTUAL_FUNDS','Professionally managed pooled investments', 'Equity Mutual Fund', 'HIGH', 'LONG', 'Open-ended equity funds priced at daily NAV'),
    ('COMMODITIES', 'Tradable physical or financial raw materials', 'Precious Metals', 'MEDIUM', 'ANY', 'Gold and silver exposure'),
    ('BONDS',       'Fixed-income debt instruments', 'Corporate Bonds', 'LOW', 'ANY', 'Indian investment-grade corporate debt'),
    ('CRYPTO',      'Blockchain-based digital assets', 'Digital Assets', 'VERY_HIGH', 'LONG', 'Unregulated crypto assets with high volatility'),
    ('REITS',       'Listed real-estate investment trusts', 'Listed REIT', 'MEDIUM', 'LONG', 'Exchange-traded ownership of income-producing real estate'),
    ('ETFS',        'Exchange-traded pooled investment products', 'Broad Market ETF', 'HIGH', 'LONG', 'Exchange-traded index and sector funds')
ON DUPLICATE KEY UPDATE
    asset_description = VALUES(asset_description),
    risk = VALUES(risk),
    investment_horizon = VALUES(investment_horizon),
    sub_asset_description = VALUES(sub_asset_description);

-- Additional subclasses documented in REST API - AssetClasses - JavaSpring 3.pdf.
-- The existing application enum has BONDS rather than a separate FIXED_INCOME value.
INSERT INTO asset_class_master
    (asset_class, asset_description, sub_asset_class, risk, investment_horizon, sub_asset_description)
VALUES
    ('CASH', 'Cash and cash equivalents', 'Cash', 'LOW', 'SHORT',
        'Cash balance held in a bank account'),
    ('MUTUAL_FUNDS', 'Mutual fund asset class', 'Stock Funds', 'HIGH', 'LONG',
        'Funds investing principally in equity or stocks'),
    ('MUTUAL_FUNDS', 'Mutual fund asset class', 'Bond Funds', 'LOW', 'ANY',
        'Funds investing in government bonds, corporate bonds, or other debt instruments'),
    ('MUTUAL_FUNDS', 'Mutual fund asset class', 'Index Funds', 'MEDIUM', 'ANY',
        'Funds tracking a major market index'),
    ('MUTUAL_FUNDS', 'Mutual fund asset class', 'Balanced Funds', 'MEDIUM', 'LONG',
        'Funds investing across stocks, bonds, money-market instruments, or alternatives'),
    ('MUTUAL_FUNDS', 'Mutual fund asset class', 'Money Market Funds', 'LOW', 'SHORT',
        'Funds investing mainly in short-term government debt'),
    ('MUTUAL_FUNDS', 'Mutual fund asset class', 'Income Funds', 'HIGH', 'LONG',
        'Funds investing primarily in government and high-quality corporate debt'),
    ('MUTUAL_FUNDS', 'Mutual fund asset class', 'International/Global Funds', 'HIGH', 'LONG',
        'Funds investing in assets located outside the investor''s home country'),
    ('MUTUAL_FUNDS', 'Mutual fund asset class', 'Speciality Funds', 'HIGH', 'LONG',
        'Funds targeted at specific sectors of the economy'),
    ('MUTUAL_FUNDS', 'Mutual fund asset class', 'Exchange Traded Funds (ETFs)', 'MEDIUM', 'ANY',
        'Exchange-traded funds using strategies consistent with mutual funds'),
    ('BONDS', 'Fixed Income asset class', 'T-Bills (Treasury Bills)', 'LOW', 'SHORT',
        'Short-term fixed-income securities maturing within one year'),
    ('BONDS', 'Fixed Income asset class', 'T-Notes (Treasury Notes)', 'LOW', 'ANY',
        'Treasury notes with maturities between two and ten years'),
    ('BONDS', 'Fixed Income asset class', 'T-Bonds (Treasury Bonds)', 'LOW', 'LONG',
        'Treasury bonds with long-term maturities'),
    ('BONDS', 'Fixed Income asset class', 'TIPS (Treasury Inflation-Protected Securities)', 'LOW', 'LONG',
        'Treasury securities whose principal adjusts with inflation'),
    ('BONDS', 'Fixed Income asset class', 'Municipal Bond', 'LOW', 'LONG',
        'Government-issued debt backed by a state, municipality, or county'),
    ('BONDS', 'Fixed Income asset class', 'Corporate Bond', 'MEDIUM', 'ANY',
        'Corporate debt whose price and coupon reflect issuer creditworthiness'),
    ('BONDS', 'Fixed Income asset class', 'Junk Bond', 'HIGH', 'ANY',
        'High-yield corporate debt with elevated default risk'),
    ('BONDS', 'Fixed Income asset class', 'Certificate of Deposit (CD)', 'MEDIUM', 'ANY',
        'Fixed-income deposit instrument with a maturity of less than five years'),
    ('COMMODITIES', 'Commodities', 'Gold', 'LOW', 'LONG',
        'Twenty-four-carat gold traded on exchanges'),
    ('REITS', 'Real Estate Investment Trusts', 'REITs', 'MEDIUM', 'LONG',
        'Income-producing real-estate investments earning rental income'),
    ('ETFS', 'Exchange-traded pooled investment products', 'Exchange Traded Funds (ETFs)', 'MEDIUM', 'ANY',
        'Exchange-traded funds using strategies consistent with mutual funds')
ON DUPLICATE KEY UPDATE
    asset_description = VALUES(asset_description),
    risk = VALUES(risk),
    investment_horizon = VALUES(investment_horizon),
    sub_asset_description = VALUES(sub_asset_description);

INSERT INTO gics_industries (industry_code, industry_name, sector_code, sector_name)
VALUES
    ('101010','Energy Equipment & Services','10','Energy'),
    ('151010','Chemicals','15','Materials'),
    ('201010','Air Freight & Logistics','20','Industrials'),
    ('202010','Commercial Services & Supplies','20','Industrials'),
    ('251010','Auto Components','25','Consumer Discretionary'),
    ('255010','Broadline Retail','25','Consumer Discretionary'),
    ('301010','Consumer Staples Merchandise Retail','30','Consumer Staples'),
    ('351010','Health Care Equipment & Supplies','35','Health Care'),
    ('451010','IT Services','45','Information Technology'),
    ('452010','Semiconductors & Semiconductor Equipment','45','Information Technology'),
    ('551010','Automobiles','25','Consumer Discretionary'),
    ('551020','Hotels, Resorts & Cruise Lines','25','Consumer Discretionary'),
    ('551030','Household Products','30','Consumer Staples'),
    ('551040','Tobacco','30','Consumer Staples'),
    ('601010','Real Estate Management & Development','60','Real Estate'),
    ('601020','Mortgage REITs','60','Real Estate'),
    ('402010','Banks','40','Financials'),
    ('402020','Consumer Finance','40','Financials'),
    ('403010','Capital Markets','40','Financials'),
    ('452020','Technology Hardware, Storage & Peripherals','45','Information Technology')
ON DUPLICATE KEY UPDATE
    industry_name = VALUES(industry_name),
    sector_code = VALUES(sector_code),
    sector_name = VALUES(sector_name);

DROP TEMPORARY TABLE IF EXISTS tmp_seed_securities;
CREATE TEMPORARY TABLE tmp_seed_securities (
    symbol VARCHAR(50) NOT NULL PRIMARY KEY,
    asset_type VARCHAR(20) NOT NULL,
    asset_class VARCHAR(20) NOT NULL,
    sub_asset_class VARCHAR(100) NOT NULL,
    isin VARCHAR(12) NULL,
    cupid VARCHAR(50) NULL,
    series VARCHAR(10) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description VARCHAR(500) NOT NULL,
    exchange VARCHAR(30) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    country VARCHAR(100) NOT NULL,
    market VARCHAR(100) NOT NULL,
    risk_level VARCHAR(30) NOT NULL,
    equity_category VARCHAR(20) NULL,
    gics_industry_code CHAR(6) NOT NULL,
    base_price DECIMAL(20,6) NOT NULL,
    price_factor DECIMAL(10,6) NOT NULL
);

INSERT INTO tmp_seed_securities VALUES
('RELIANCE','EQUITY','STOCKS','STOCKS','IN0000000001','CUPID-RELIANCE','EQ','Reliance Industries','Integrated energy, retail and digital services company','NSE','INR','India','Indian Equity','HIGH','LARGE_CAP','101010',2800.000000,0.0015),
('HDFCBANK','EQUITY','STOCKS','STOCKS','IN0000000002','CUPID-HDFCBANK','EQ','HDFC Bank','Private-sector commercial bank','NSE','INR','India','Indian Equity','HIGH','LARGE_CAP','402010',1700.000000,0.0012),
('TCS','EQUITY','STOCKS','STOCKS','IN0000000003','CUPID-TCS','EQ','Tata Consultancy Services','Information technology services provider','NSE','INR','India','Indian Equity','HIGH','LARGE_CAP','451010',3900.000000,0.0013),
('INFY','EQUITY','STOCKS','STOCKS','IN0000000004','CUPID-INFY','EQ','Infosys','Information technology consulting and services provider','NSE','INR','India','Indian Equity','HIGH','LARGE_CAP','451010',1800.000000,0.0014),
('ICICIBANK','EQUITY','STOCKS','STOCKS','IN0000000005','CUPID-ICICIBANK','EQ','ICICI Bank','Private-sector commercial bank','NSE','INR','India','Indian Equity','HIGH','LARGE_CAP','402010',1250.000000,0.0013),
('SBIN','EQUITY','STOCKS','STOCKS','IN0000000006','CUPID-SBIN','EQ','State Bank of India','Public-sector commercial bank','NSE','INR','India','Indian Equity','HIGH','LARGE_CAP','402010',900.000000,0.0017),
('ITC','EQUITY','STOCKS','STOCKS','IN0000000007','CUPID-ITC','EQ','ITC','Consumer products, hotels and paper company','NSE','INR','India','Indian Equity','MEDIUM','LARGE_CAP','551040',500.000000,0.0010),
('BHARTIARTL','EQUITY','STOCKS','STOCKS','IN0000000009','CUPID-BHARTIARTL','EQ','Bharti Airtel','Telecommunications services provider','NSE','INR','India','Indian Equity','HIGH','LARGE_CAP','452020',1900.000000,0.0015),
('HDFCFLEXICAP','MUTUAL','MUTUAL_FUNDS','Stock Funds','IN0000000011','CUPID-HDFCFLEXI','MF','HDFC Flexi Cap Fund','Diversified equity mutual fund','AMFI','INR','India','Indian Mutual Funds','HIGH',NULL,'451010',180.000000,0.0008),
('PARAGFLEXI','MUTUAL','MUTUAL_FUNDS','Stock Funds','IN0000000012','CUPID-PARAGFLEXI','MF','Parag Parikh Flexi Cap Fund','Diversified equity mutual fund','AMFI','INR','India','Indian Mutual Funds','HIGH',NULL,'403010',95.000000,0.0009),
('HDFCBALADV','MUTUAL','MUTUAL_FUNDS','Balanced Funds','IN0000000014','CUPID-HDFCBALADV','MF','HDFC Balanced Advantage Fund','Hybrid mutual fund investing across equity and fixed income','AMFI','INR','India','Indian Mutual Funds','MEDIUM',NULL,'402010',350.000000,0.0007),
('HDFCMIDCAP','MUTUAL','MUTUAL_FUNDS','Stock Funds','IN0000000015','CUPID-HDFCMIDCAP','MF','HDFC Mid-Cap Opportunities Fund','Mid-cap equity mutual fund','AMFI','INR','India','Indian Mutual Funds','HIGH',NULL,'451010',180.000000,0.0010),
('GOLD','COMMODITY','COMMODITIES','Gold','IN0000000016','CUPID-GOLD','CMD','Gold Spot','Synthetic Indian gold spot price','MCX','INR','India','Commodity Market','MEDIUM',NULL,'151010',72000.000000,0.0010),
('SILVER','COMMODITY','COMMODITIES','Precious Metals','IN0000000017','CUPID-SILVER','CMD','Silver Spot','Synthetic Indian silver spot price','MCX','INR','India','Commodity Market','MEDIUM',NULL,'151010',90000.000000,0.0018),
('SBINBOND','BOND','BONDS','Corporate Bond','IN0000000018','CUPID-SBINBOND','BND','State Bank of India 2031 Bond','Indian investment-grade corporate bond','BSE','INR','India','Indian Debt Market','LOW',NULL,'402010',100.000000,0.0002),
('HDFCBOND','BOND','BONDS','Corporate Bond','IN0000000019','CUPID-HDFCBOND','BND','HDFC Bank 2032 Bond','Indian investment-grade corporate bond','BSE','INR','India','Indian Debt Market','LOW',NULL,'402010',100.000000,0.0002),
('PFCBOND','BOND','BONDS','Corporate Bond','IN0000000020','CUPID-PFCBOND','BND','Power Finance Corporation 2030 Bond','Indian investment-grade corporate bond','BSE','INR','India','Indian Debt Market','LOW',NULL,'403010',100.000000,0.0003),
('RELIANCEBOND','BOND','BONDS','Corporate Bond','IN0000000021','CUPID-RELIANCEBOND','BND','Reliance Industries 2032 Bond','Indian investment-grade corporate bond','BSE','INR','India','Indian Debt Market','LOW',NULL,'101010',100.000000,0.0003),
('EMBASSY','REIT','REITS','REITs','IN0000000022','CUPID-EMBASSY','REIT','Embassy Office Parks REIT','Listed office real-estate investment trust','NSE','INR','India','Indian REIT Market','MEDIUM',NULL,'601010',420.000000,0.0012),
('MINDSPACE','REIT','REITS','REITs','IN0000000023','CUPID-MINDSPACE','REIT','Mindspace Business Parks REIT','Listed office real-estate investment trust','NSE','INR','India','Indian REIT Market','MEDIUM',NULL,'601010',380.000000,0.0011),
('NIFTYBEES','ETF','ETFS','Exchange Traded Funds (ETFs)','IN0000000024','CUPID-NIFTYBEES','ETF','Nippon India ETF Nifty BeES','Exchange-traded Nifty 50 index fund','NSE','INR','India','Indian ETF Market','HIGH',NULL,'403010',280.000000,0.0010),
('BANKBEES','ETF','ETFS','Exchange Traded Funds (ETFs)','IN0000000025','CUPID-BANKBEES','ETF','Nippon India ETF Bank BeES','Exchange-traded banking index fund','NSE','INR','India','Indian ETF Market','HIGH',NULL,'402010',560.000000,0.0013),
('BTCINR','CRYPTO','CRYPTO','Digital Assets',NULL,NULL,'CRYPTO','Bitcoin INR','India-focused Bitcoin reference price','CRYPTO','INR','India','Indian Crypto Market','VERY_HIGH',NULL,'452010',7500000.000000,0.0030),
('ETHINR','CRYPTO','CRYPTO','Digital Assets',NULL,NULL,'CRYPTO','Ethereum INR','India-focused Ethereum reference price','CRYPTO','INR','India','Indian Crypto Market','VERY_HIGH',NULL,'452010',280000.000000,0.0035),
('SOLINR','CRYPTO','CRYPTO','Digital Assets',NULL,NULL,'CRYPTO','Solana INR','India-focused Solana reference price','CRYPTO','INR','India','Indian Crypto Market','VERY_HIGH',NULL,'452010',15000.000000,0.0040);

-- Remove instruments from the earlier non-India seed version.
DELETE p
FROM daily_prices p
JOIN security_details s ON s.security_id = p.security_id
WHERE s.symbol IN ('BTC', 'ETH', 'ITBEES');

DELETE p
FROM daily_prices p
JOIN security_details s ON s.security_id = p.security_id
WHERE s.symbol IN ('LT', 'MARUTI', 'GOLDFUND');

DELETE s
FROM security_details s
WHERE s.symbol IN ('BTC', 'ETH', 'ITBEES', 'LT', 'MARUTI', 'GOLDFUND');

-- Identifier rules:
-- All current instruments are India-related: ISIN is populated and CUPID is NULL.
UPDATE tmp_seed_securities
SET cupid = NULL
WHERE exchange NOT IN ('LSE', 'LSEG');

UPDATE tmp_seed_securities
SET cupid = NULL
WHERE country = 'India';

UPDATE security_details s
JOIN tmp_seed_securities t ON t.symbol = s.symbol
JOIN asset_class_master a
  ON a.asset_class = t.asset_class AND a.sub_asset_class = t.sub_asset_class
SET s.asset_type = t.asset_type, s.isin = t.isin, s.cupid = t.cupid, s.series = t.series,
    s.name = t.name, s.description = t.description, s.exchange = t.exchange,
    s.currency = t.currency, s.country = t.country, s.market = t.market,
    s.risk_level = t.risk_level, s.status = 'ACTIVE', s.asset_class_id = a.asset_id,
    s.equity_category = t.equity_category, s.gics_industry_code = t.gics_industry_code,
    s.logo_url = CONCAT('https://assets.example.test/logos/', LOWER(t.symbol), '.svg'),
    s.website_url = CONCAT('https://www.example.test/securities/', LOWER(t.symbol)),
    s.updated_at = CURRENT_TIMESTAMP(6);

INSERT INTO security_details
    (asset_type, isin, cupid, symbol, series, name, description, exchange, currency, asset_class_id,
     equity_category, gics_industry_code, logo_url, website_url, country, market, risk_level, status,
     created_at, updated_at)
SELECT t.asset_type, t.isin, t.cupid, t.symbol, t.series, t.name, t.description, t.exchange, t.currency,
       a.asset_id, t.equity_category, t.gics_industry_code,
       CONCAT('https://assets.example.test/logos/', LOWER(t.symbol), '.svg'),
       CONCAT('https://www.example.test/securities/', LOWER(t.symbol)),
       t.country, t.market, t.risk_level, 'ACTIVE', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
FROM tmp_seed_securities t
JOIN asset_class_master a
  ON a.asset_class = t.asset_class AND a.sub_asset_class = t.sub_asset_class
WHERE NOT EXISTS (SELECT 1 FROM security_details s WHERE s.symbol = t.symbol);

INSERT INTO bond_details
    (security_id, issuer, issuer_type, bond_name, bond_type, face_value, issue_price, coupon_rate,
     coupon_type, coupon_frequency, issue_date, maturity_date, yield_to_maturity, credit_rating,
     rating_agency, callable, puttable, minimum_investment, created_at, updated_at)
SELECT s.security_id, t.name, 'CORPORATE', t.name, 'SENIOR_SECURED', 100, 100,
       CASE t.symbol WHEN 'SBINBOND' THEN 7.250000 WHEN 'HDFCBOND' THEN 7.100000 ELSE 7.500000 END,
       'FIXED', 'ANNUAL', '2024-01-01',
       CASE t.symbol WHEN 'SBINBOND' THEN '2031-01-01' WHEN 'HDFCBOND' THEN '2032-01-01' ELSE '2030-01-01' END,
       CASE t.symbol WHEN 'SBINBOND' THEN 7.100000 WHEN 'HDFCBOND' THEN 6.950000 ELSE 7.300000 END,
       CASE t.symbol WHEN 'SBINBOND' THEN 'AAA' WHEN 'HDFCBOND' THEN 'AAA' ELSE 'AA+' END,
       'CRISIL', TRUE, FALSE, 1000, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
FROM security_details s
JOIN tmp_seed_securities t ON t.symbol = s.symbol
WHERE t.asset_type = 'BOND'
ON DUPLICATE KEY UPDATE issuer = VALUES(issuer), bond_name = VALUES(bond_name),
    coupon_rate = VALUES(coupon_rate), maturity_date = VALUES(maturity_date),
    yield_to_maturity = VALUES(yield_to_maturity), updated_at = CURRENT_TIMESTAMP(6);

DELETE p
FROM daily_prices p
JOIN security_details s ON s.security_id = p.security_id
JOIN tmp_seed_securities t ON t.symbol = s.symbol
WHERE p.trade_date BETWEEN '2026-01-01' AND '2026-10-02';

-- One row per weekday, per seeded security. Close prices are deterministic and positive.
INSERT INTO daily_prices
    (security_id, trade_date, open_price, high_price, low_price, close_price, prev_close,
     last_price, volume, nav, spot_price, valuation_price)
WITH RECURSIVE calendar AS (
    SELECT DATE('2026-01-01') AS trade_date
    UNION ALL
    SELECT trade_date + INTERVAL 1 DAY
    FROM calendar
    WHERE trade_date < DATE('2026-10-02')
),
weekdays AS (
    SELECT trade_date, DATEDIFF(trade_date, DATE('2026-01-01')) AS day_number
    FROM calendar
    WHERE DAYOFWEEK(trade_date) BETWEEN 2 AND 6
)
SELECT s.security_id, w.trade_date,
       CASE WHEN t.asset_type = 'MUTUAL' THEN NULL ELSE ROUND(GREATEST(0.000001, t.base_price *
           (1 + t.price_factor * SIN(w.day_number + s.security_id)
              + t.price_factor * 0.35 * COS(w.day_number / 3 + s.security_id)))
           * (1 - 0.004 - ABS(SIN(w.day_number + s.security_id)) * 0.002), 6) END,
       CASE WHEN t.asset_type = 'MUTUAL' THEN NULL ELSE ROUND(GREATEST(0.000001, t.base_price *
           (1 + t.price_factor * SIN(w.day_number + s.security_id)
              + t.price_factor * 0.35 * COS(w.day_number / 3 + s.security_id)))
           * (1 + 0.004 + ABS(COS(w.day_number + s.security_id)) * 0.002), 6) END,
       CASE WHEN t.asset_type = 'MUTUAL' THEN NULL ELSE ROUND(GREATEST(0.000001, t.base_price *
           (1 + t.price_factor * SIN(w.day_number + s.security_id)
              + t.price_factor * 0.35 * COS(w.day_number / 3 + s.security_id)))
           * (1 - 0.006 - ABS(COS(w.day_number + s.security_id)) * 0.002), 6) END,
       CASE WHEN t.asset_type = 'MUTUAL' THEN NULL ELSE ROUND(GREATEST(0.000001, t.base_price *
           (1 + t.price_factor * SIN(w.day_number + s.security_id)
              + t.price_factor * 0.35 * COS(w.day_number / 3 + s.security_id))), 6) END,
       CASE WHEN t.asset_type = 'MUTUAL' THEN NULL ELSE ROUND(GREATEST(0.000001, t.base_price * (1 + t.price_factor * SIN(w.day_number - 1 + s.security_id))), 6) END,
       CASE WHEN t.asset_type = 'MUTUAL' THEN NULL ELSE ROUND(GREATEST(0.000001, t.base_price *
           (1 + t.price_factor * SIN(w.day_number + s.security_id)
              + t.price_factor * 0.35 * COS(w.day_number / 3 + s.security_id))), 6) END,
       CASE WHEN t.asset_type = 'MUTUAL' THEN NULL ELSE 100000 + MOD(w.day_number * 7919 + s.security_id * 104729, 9000000) END,
       CASE WHEN t.asset_type IN ('MUTUAL','ETF') THEN ROUND(GREATEST(0.000001, t.base_price *
           (1 + t.price_factor * SIN(w.day_number + s.security_id)
              + t.price_factor * 0.35 * COS(w.day_number / 3 + s.security_id))), 6) ELSE NULL END,
       CASE WHEN t.asset_type IN ('COMMODITY','CRYPTO') THEN ROUND(GREATEST(0.000001, t.base_price *
           (1 + t.price_factor * SIN(w.day_number + s.security_id)
              + t.price_factor * 0.35 * COS(w.day_number / 3 + s.security_id))), 6) ELSE NULL END,
       ROUND(GREATEST(0.000001, t.base_price *
           (1 + t.price_factor * SIN(w.day_number + s.security_id)
              + t.price_factor * 0.35 * COS(w.day_number / 3 + s.security_id))), 6)
FROM weekdays w
CROSS JOIN security_details s
JOIN tmp_seed_securities t ON t.symbol = s.symbol
;

DROP TEMPORARY TABLE tmp_seed_securities;
COMMIT;
