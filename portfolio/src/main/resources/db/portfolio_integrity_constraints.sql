-- MySQL 8 rollout. Back up first. The entity mappings also declare these keys;
-- each conditional below checks the live schema so this script can follow Hibernate
-- ddl-auto=update without attempting to add an existing constraint a second time.
-- Run the preflight queries and resolve every result before applying section 3.

-- 1. Backfill only when the unique ISIN match exists.
UPDATE portfolio_holdings h
JOIN security_details s ON s.isin = h.isin
SET h.security_id = s.security_id
WHERE h.security_id IS NULL AND h.isin IS NOT NULL;

UPDATE portfolio_trades t
JOIN security_details s ON s.isin = t.isin
SET t.security_id = s.security_id
WHERE t.security_id IS NULL AND t.isin IS NOT NULL;

-- 2. Preflight. Every query must return no rows before section 3.
SELECT 'portfolio required values' AS issue, id FROM portfolios
WHERE name IS NULL OR type IS NULL OR currency IS NULL OR benchmark IS NULL
     OR exchange IS NULL OR rebalance_frequency IS NULL OR amount IS NULL
     OR amount < 0 OR purchase_date IS NULL;

SELECT 'portfolio user orphan' AS issue, p.id, p.user_id FROM portfolios p
LEFT JOIN app_users u ON u.id = p.user_id WHERE u.id IS NULL;

SELECT 'portfolio theme orphan' AS issue, p.id, p.theme FROM portfolios p
LEFT JOIN investment_themes t ON t.theme_code = p.theme
WHERE p.theme IS NOT NULL AND t.id IS NULL;

SELECT 'holding invalid values' AS issue, id FROM portfolio_holdings
WHERE portfolio_id IS NULL OR security_id IS NULL OR asset_class IS NULL
     OR shares IS NULL OR shares <= 0 OR price IS NULL OR price <= 0
     OR value IS NULL OR value < 0 OR price_date IS NULL;

SELECT 'holding portfolio orphan' AS issue, h.id, h.portfolio_id FROM portfolio_holdings h
LEFT JOIN portfolios p ON p.id = h.portfolio_id WHERE p.id IS NULL;

SELECT 'holding security orphan' AS issue, h.id, h.security_id, h.isin FROM portfolio_holdings h
LEFT JOIN security_details s ON s.security_id = h.security_id WHERE s.security_id IS NULL;

SELECT portfolio_id, security_id, COUNT(*) AS row_count,
             GROUP_CONCAT(id ORDER BY id) AS holding_ids
FROM portfolio_holdings
GROUP BY portfolio_id, security_id
HAVING COUNT(*) > 1;

SELECT 'trade invalid values' AS issue, id FROM portfolio_trades
WHERE portfolio_id IS NULL OR security_id IS NULL OR asset_class IS NULL
     OR signed_shares IS NULL OR signed_shares = 0 OR unit_price IS NULL
     OR unit_price <= 0 OR trade_date IS NULL;

SELECT 'trade portfolio orphan' AS issue, t.id, t.portfolio_id FROM portfolio_trades t
LEFT JOIN portfolios p ON p.id = t.portfolio_id WHERE p.id IS NULL;

SELECT 'trade security orphan' AS issue, t.id, t.security_id, t.isin FROM portfolio_trades t
LEFT JOIN security_details s ON s.security_id = t.security_id WHERE s.security_id IS NULL;

SELECT theme_id, asset_class, COUNT(*) AS row_count
FROM theme_allocations
GROUP BY theme_id, asset_class
HAVING COUNT(*) > 1;

SELECT 'theme allocation EQUITY/STOCKS conflict' AS issue, theme_id
FROM theme_allocations
WHERE asset_class IN ('EQUITY', 'STOCKS')
GROUP BY theme_id
HAVING COUNT(*) > 1;

SELECT 'theme allocation invalid percentage' AS issue, id, theme_id, percentage
FROM theme_allocations
WHERE percentage IS NULL OR percentage < 0 OR percentage > 100;

SELECT 'daily price security orphan' AS issue, d.id, d.security_id FROM daily_prices d
LEFT JOIN security_details s ON s.security_id = d.security_id WHERE s.security_id IS NULL;

SELECT 'invalid daily market price' AS issue, d.id, d.security_id, d.trade_date
FROM daily_prices d
WHERE ((d.valuation_price IS NULL OR d.valuation_price <= 0)
        AND (d.close_price IS NULL OR d.close_price <= 0)
        AND (d.nav IS NULL OR d.nav <= 0)
        AND (d.spot_price IS NULL OR d.spot_price <= 0)
        AND (d.last_price IS NULL OR d.last_price <= 0))
        OR (d.open_price IS NOT NULL AND d.open_price <= 0)
        OR (d.high_price IS NOT NULL AND d.high_price <= 0)
        OR (d.low_price IS NOT NULL AND d.low_price <= 0)
        OR (d.prev_close IS NOT NULL AND d.prev_close <= 0)
        OR (d.last_price IS NOT NULL AND d.last_price <= 0)
        OR (d.close_price IS NOT NULL AND d.close_price <= 0)
        OR (d.nav IS NOT NULL AND d.nav <= 0)
        OR (d.spot_price IS NOT NULL AND d.spot_price <= 0)
        OR (d.valuation_price IS NOT NULL AND d.valuation_price <= 0)
        OR (d.volume IS NOT NULL AND d.volume < 0)
        OR (d.high_price IS NOT NULL AND d.low_price IS NOT NULL AND d.high_price < d.low_price);

SELECT 'benchmark price parent orphan' AS issue, d.id, d.benchmark_id FROM benchmark_daily_prices d
LEFT JOIN benchmark_indices b ON b.benchmark_id = d.benchmark_id WHERE b.benchmark_id IS NULL;

SELECT 'theme allocation parent orphan' AS issue, a.id, a.theme_id FROM theme_allocations a
LEFT JOIN investment_themes t ON t.id = a.theme_id WHERE t.id IS NULL;

SELECT 'bond detail parent orphan' AS issue, b.security_id FROM bond_details b
LEFT JOIN security_details s ON s.security_id = b.security_id WHERE s.security_id IS NULL;

-- For unmatched historical securities, restore/create security_details with status='INACTIVE'.
-- For duplicate holdings, reconcile shares/value and retain one row; never merge blindly.

-- 3. Normalize required numeric columns and the portfolio theme key.
ALTER TABLE portfolios
        MODIFY name VARCHAR(255) NOT NULL,
        MODIFY type VARCHAR(255) NOT NULL,
        MODIFY currency VARCHAR(255) NOT NULL,
        MODIFY benchmark VARCHAR(255) NOT NULL,
        MODIFY exchange VARCHAR(255) NOT NULL,
        MODIFY rebalance_frequency VARCHAR(255) NOT NULL,
        MODIFY amount DECIMAL(20,2) NOT NULL,
        MODIFY theme VARCHAR(40) NULL,
        MODIFY purchase_date DATE NOT NULL;

ALTER TABLE portfolio_holdings
        MODIFY security_id BIGINT NOT NULL,
        MODIFY asset_class VARCHAR(40) NOT NULL,
        MODIFY shares DECIMAL(24,8) NOT NULL,
        MODIFY price DECIMAL(20,6) NOT NULL,
        MODIFY value DECIMAL(20,2) NOT NULL,
        MODIFY price_date DATE NOT NULL;

ALTER TABLE portfolio_trades
        MODIFY asset_class VARCHAR(40) NOT NULL;

ALTER TABLE theme_allocations
        MODIFY asset_class VARCHAR(40) NOT NULL,
        MODIFY percentage DECIMAL(5,2) NOT NULL;

-- Legacy data used the security type EQUITY where the portfolio asset class is STOCKS.
UPDATE portfolio_holdings SET asset_class = 'STOCKS' WHERE asset_class = 'EQUITY';
UPDATE portfolio_trades SET asset_class = 'STOCKS' WHERE asset_class = 'EQUITY';
UPDATE theme_allocations SET asset_class = 'STOCKS' WHERE asset_class = 'EQUITY';

-- 4. Add checks and unique keys only when Hibernate or an earlier run has not added them.
SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_schema = DATABASE() AND table_name = 'portfolios'
            AND constraint_name = 'ck_portfolios_amount_nonnegative'),
        'SELECT 1', 'ALTER TABLE portfolios ADD CONSTRAINT ck_portfolios_amount_nonnegative CHECK (amount >= 0)');
PREPARE constraint_stmt FROM @ddl; EXECUTE constraint_stmt; DEALLOCATE PREPARE constraint_stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_schema = DATABASE() AND table_name = 'portfolio_holdings'
            AND constraint_name = 'ck_portfolio_holdings_positive_values'),
        'SELECT 1', 'ALTER TABLE portfolio_holdings ADD CONSTRAINT ck_portfolio_holdings_positive_values CHECK (shares > 0 AND price > 0 AND value >= 0)');
PREPARE constraint_stmt FROM @ddl; EXECUTE constraint_stmt; DEALLOCATE PREPARE constraint_stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_schema = DATABASE() AND table_name = 'portfolio_trades'
            AND constraint_name = 'ck_portfolio_trades_valid_values'),
        'SELECT 1', 'ALTER TABLE portfolio_trades ADD CONSTRAINT ck_portfolio_trades_valid_values CHECK (signed_shares <> 0 AND unit_price > 0)');
PREPARE constraint_stmt FROM @ddl; EXECUTE constraint_stmt; DEALLOCATE PREPARE constraint_stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_schema = DATABASE() AND table_name = 'theme_allocations'
            AND constraint_name = 'ck_theme_allocations_percentage_range'),
        'SELECT 1', 'ALTER TABLE theme_allocations ADD CONSTRAINT ck_theme_allocations_percentage_range CHECK (percentage >= 0 AND percentage <= 100)');
PREPARE constraint_stmt FROM @ddl; EXECUTE constraint_stmt; DEALLOCATE PREPARE constraint_stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.table_constraints
                WHERE constraint_schema = DATABASE() AND table_name = 'daily_prices'
                        AND constraint_name = 'ck_daily_prices_valid_values'),
                'SELECT 1', 'ALTER TABLE daily_prices ADD CONSTRAINT ck_daily_prices_valid_values CHECK (((valuation_price IS NOT NULL AND valuation_price > 0) OR (close_price IS NOT NULL AND close_price > 0) OR (nav IS NOT NULL AND nav > 0) OR (spot_price IS NOT NULL AND spot_price > 0) OR (last_price IS NOT NULL AND last_price > 0)) AND (open_price IS NULL OR open_price > 0) AND (high_price IS NULL OR high_price > 0) AND (low_price IS NULL OR low_price > 0) AND (prev_close IS NULL OR prev_close > 0) AND (last_price IS NULL OR last_price > 0) AND (close_price IS NULL OR close_price > 0) AND (nav IS NULL OR nav > 0) AND (spot_price IS NULL OR spot_price > 0) AND (valuation_price IS NULL OR valuation_price > 0) AND (volume IS NULL OR volume >= 0) AND (high_price IS NULL OR low_price IS NULL OR high_price >= low_price))');
PREPARE constraint_stmt FROM @ddl; EXECUTE constraint_stmt; DEALLOCATE PREPARE constraint_stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_schema = DATABASE() AND table_name = 'portfolio_holdings'
            AND constraint_name = 'uk_portfolio_holdings_portfolio_security'),
        'SELECT 1', 'ALTER TABLE portfolio_holdings ADD CONSTRAINT uk_portfolio_holdings_portfolio_security UNIQUE (portfolio_id, security_id)');
PREPARE constraint_stmt FROM @ddl; EXECUTE constraint_stmt; DEALLOCATE PREPARE constraint_stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_schema = DATABASE() AND table_name = 'theme_allocations'
            AND constraint_name = 'uk_theme_allocations_theme_asset'),
        'SELECT 1', 'ALTER TABLE theme_allocations ADD CONSTRAINT uk_theme_allocations_theme_asset UNIQUE (theme_id, asset_class)');
PREPARE constraint_stmt FROM @ddl; EXECUTE constraint_stmt; DEALLOCATE PREPARE constraint_stmt;

-- Foreign keys are detected by their column relationship, including older unnamed keys.
SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.key_column_usage
        WHERE constraint_schema = DATABASE() AND table_name = 'portfolio_holdings'
            AND column_name = 'portfolio_id' AND referenced_table_name = 'portfolios'
            AND referenced_column_name = 'id'),
        'SELECT 1', 'ALTER TABLE portfolio_holdings ADD CONSTRAINT fk_portfolio_holdings_portfolio FOREIGN KEY (portfolio_id) REFERENCES portfolios (id) ON UPDATE CASCADE ON DELETE RESTRICT');
PREPARE constraint_stmt FROM @ddl; EXECUTE constraint_stmt; DEALLOCATE PREPARE constraint_stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.key_column_usage
        WHERE constraint_schema = DATABASE() AND table_name = 'portfolio_holdings'
            AND column_name = 'security_id' AND referenced_table_name = 'security_details'
            AND referenced_column_name = 'security_id'),
        'SELECT 1', 'ALTER TABLE portfolio_holdings ADD CONSTRAINT fk_portfolio_holdings_security FOREIGN KEY (security_id) REFERENCES security_details (security_id) ON UPDATE CASCADE ON DELETE RESTRICT');
PREPARE constraint_stmt FROM @ddl; EXECUTE constraint_stmt; DEALLOCATE PREPARE constraint_stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.key_column_usage
        WHERE constraint_schema = DATABASE() AND table_name = 'portfolio_trades'
            AND column_name = 'portfolio_id' AND referenced_table_name = 'portfolios'
            AND referenced_column_name = 'id'),
        'SELECT 1', 'ALTER TABLE portfolio_trades ADD CONSTRAINT fk_portfolio_trades_portfolio FOREIGN KEY (portfolio_id) REFERENCES portfolios (id) ON UPDATE CASCADE ON DELETE RESTRICT');
PREPARE constraint_stmt FROM @ddl; EXECUTE constraint_stmt; DEALLOCATE PREPARE constraint_stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.key_column_usage
        WHERE constraint_schema = DATABASE() AND table_name = 'portfolio_trades'
            AND column_name = 'security_id' AND referenced_table_name = 'security_details'
            AND referenced_column_name = 'security_id'),
        'SELECT 1', 'ALTER TABLE portfolio_trades ADD CONSTRAINT fk_portfolio_trades_security FOREIGN KEY (security_id) REFERENCES security_details (security_id) ON UPDATE CASCADE ON DELETE RESTRICT');
PREPARE constraint_stmt FROM @ddl; EXECUTE constraint_stmt; DEALLOCATE PREPARE constraint_stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.key_column_usage
        WHERE constraint_schema = DATABASE() AND table_name = 'portfolios'
            AND column_name = 'theme' AND referenced_table_name = 'investment_themes'
            AND referenced_column_name = 'theme_code'),
        'SELECT 1', 'ALTER TABLE portfolios ADD CONSTRAINT fk_portfolios_theme FOREIGN KEY (theme) REFERENCES investment_themes (theme_code) ON UPDATE CASCADE ON DELETE RESTRICT');
PREPARE constraint_stmt FROM @ddl; EXECUTE constraint_stmt; DEALLOCATE PREPARE constraint_stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.key_column_usage
        WHERE constraint_schema = DATABASE() AND table_name = 'portfolios'
            AND column_name = 'user_id' AND referenced_table_name = 'app_users'
            AND referenced_column_name = 'id'),
        'SELECT 1', 'ALTER TABLE portfolios ADD CONSTRAINT fk_portfolios_user FOREIGN KEY (user_id) REFERENCES app_users (id) ON UPDATE CASCADE ON DELETE RESTRICT');
PREPARE constraint_stmt FROM @ddl; EXECUTE constraint_stmt; DEALLOCATE PREPARE constraint_stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.key_column_usage
        WHERE constraint_schema = DATABASE() AND table_name = 'theme_allocations'
            AND column_name = 'theme_id' AND referenced_table_name = 'investment_themes'
            AND referenced_column_name = 'id'),
        'SELECT 1', 'ALTER TABLE theme_allocations ADD CONSTRAINT fk_theme_allocations_theme FOREIGN KEY (theme_id) REFERENCES investment_themes (id) ON UPDATE CASCADE ON DELETE RESTRICT');
PREPARE constraint_stmt FROM @ddl; EXECUTE constraint_stmt; DEALLOCATE PREPARE constraint_stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.key_column_usage
        WHERE constraint_schema = DATABASE() AND table_name = 'daily_prices'
            AND column_name = 'security_id' AND referenced_table_name = 'security_details'
            AND referenced_column_name = 'security_id'),
        'SELECT 1', 'ALTER TABLE daily_prices ADD CONSTRAINT fk_daily_prices_security FOREIGN KEY (security_id) REFERENCES security_details (security_id) ON UPDATE CASCADE ON DELETE RESTRICT');
PREPARE constraint_stmt FROM @ddl; EXECUTE constraint_stmt; DEALLOCATE PREPARE constraint_stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.key_column_usage
        WHERE constraint_schema = DATABASE() AND table_name = 'bond_details'
            AND column_name = 'security_id' AND referenced_table_name = 'security_details'
            AND referenced_column_name = 'security_id'),
        'SELECT 1', 'ALTER TABLE bond_details ADD CONSTRAINT fk_bond_details_security FOREIGN KEY (security_id) REFERENCES security_details (security_id) ON UPDATE CASCADE ON DELETE RESTRICT');
PREPARE constraint_stmt FROM @ddl; EXECUTE constraint_stmt; DEALLOCATE PREPARE constraint_stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.key_column_usage
        WHERE constraint_schema = DATABASE() AND table_name = 'benchmark_daily_prices'
            AND column_name = 'benchmark_id' AND referenced_table_name = 'benchmark_indices'
            AND referenced_column_name = 'benchmark_id'),
        'SELECT 1', 'ALTER TABLE benchmark_daily_prices ADD CONSTRAINT fk_benchmark_daily_prices_index FOREIGN KEY (benchmark_id) REFERENCES benchmark_indices (benchmark_id) ON UPDATE CASCADE ON DELETE RESTRICT');
PREPARE constraint_stmt FROM @ddl; EXECUTE constraint_stmt; DEALLOCATE PREPARE constraint_stmt;