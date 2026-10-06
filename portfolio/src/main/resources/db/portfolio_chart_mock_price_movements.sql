-- Synthetic chart-only price movements for demo portfolio 30.
-- These mild multipliers create visible portfolio movement without overwhelming the benchmark line.
-- Original prices are retained so this script can be rerun without compounding the changes.
USE portfolio_db;

CREATE TABLE IF NOT EXISTS portfolio_chart_mock_price_baseline (
    daily_price_id BIGINT NOT NULL PRIMARY KEY,
    open_price DECIMAL(20, 6),
    high_price DECIMAL(20, 6),
    low_price DECIMAL(20, 6),
    close_price DECIMAL(20, 6),
    prev_close DECIMAL(20, 6),
    last_price DECIMAL(20, 6),
    nav DECIMAL(20, 6),
    spot_price DECIMAL(20, 6),
    valuation_price DECIMAL(20, 6)
);

INSERT IGNORE INTO portfolio_chart_mock_price_baseline (
    daily_price_id, open_price, high_price, low_price, close_price, prev_close,
    last_price, nav, spot_price, valuation_price
)
SELECT dp.id, dp.open_price, dp.high_price, dp.low_price, dp.close_price, dp.prev_close,
       dp.last_price, dp.nav, dp.spot_price, dp.valuation_price
FROM daily_prices dp
JOIN security_details s ON s.security_id = dp.security_id
WHERE s.asset_type <> 'CASH'
  AND YEAR(dp.trade_date) = 2026
  AND MONTH(dp.trade_date) IN (3, 5, 8, 9)
  AND (
      EXISTS (SELECT 1 FROM portfolio_trades t
              WHERE t.portfolio_id = 30 AND t.security_id = dp.security_id)
      OR EXISTS (SELECT 1 FROM portfolio_holdings h
                 WHERE h.portfolio_id = 30 AND h.security_id = dp.security_id)
  );

UPDATE daily_prices dp
JOIN portfolio_chart_mock_price_baseline b ON b.daily_price_id = dp.id
SET dp.open_price = ROUND(b.open_price * CASE MONTH(dp.trade_date)
        WHEN 3 THEN 1.12 WHEN 5 THEN 1.08 WHEN 8 THEN 1.15 WHEN 9 THEN 1.10 END, 6),
    dp.high_price = ROUND(b.high_price * CASE MONTH(dp.trade_date)
        WHEN 3 THEN 1.12 WHEN 5 THEN 1.08 WHEN 8 THEN 1.15 WHEN 9 THEN 1.10 END, 6),
    dp.low_price = ROUND(b.low_price * CASE MONTH(dp.trade_date)
        WHEN 3 THEN 1.12 WHEN 5 THEN 1.08 WHEN 8 THEN 1.15 WHEN 9 THEN 1.10 END, 6),
    dp.close_price = ROUND(b.close_price * CASE MONTH(dp.trade_date)
        WHEN 3 THEN 1.12 WHEN 5 THEN 1.08 WHEN 8 THEN 1.15 WHEN 9 THEN 1.10 END, 6),
    dp.prev_close = ROUND(b.prev_close * CASE MONTH(dp.trade_date)
        WHEN 3 THEN 1.12 WHEN 5 THEN 1.08 WHEN 8 THEN 1.15 WHEN 9 THEN 1.10 END, 6),
    dp.last_price = ROUND(b.last_price * CASE MONTH(dp.trade_date)
        WHEN 3 THEN 1.12 WHEN 5 THEN 1.08 WHEN 8 THEN 1.15 WHEN 9 THEN 1.10 END, 6),
    dp.nav = ROUND(b.nav * CASE MONTH(dp.trade_date)
        WHEN 3 THEN 1.12 WHEN 5 THEN 1.08 WHEN 8 THEN 1.15 WHEN 9 THEN 1.10 END, 6),
    dp.spot_price = ROUND(b.spot_price * CASE MONTH(dp.trade_date)
        WHEN 3 THEN 1.12 WHEN 5 THEN 1.08 WHEN 8 THEN 1.15 WHEN 9 THEN 1.10 END, 6),
    dp.valuation_price = ROUND(b.valuation_price * CASE MONTH(dp.trade_date)
        WHEN 3 THEN 1.12 WHEN 5 THEN 1.08 WHEN 8 THEN 1.15 WHEN 9 THEN 1.10 END, 6)
WHERE YEAR(dp.trade_date) = 2026
  AND MONTH(dp.trade_date) IN (3, 5, 8, 9);
