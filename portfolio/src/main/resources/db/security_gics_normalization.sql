-- Run after foreign_exchanges.sql has populated the GICS links.
-- This also removes legacy ETF exposure labels from security_details.
SET @drop_sector_column = IF(
    EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
            AND table_name = 'security_details'
            AND column_name = 'sector'
    ),
    'ALTER TABLE security_details DROP COLUMN sector',
    'SELECT 1'
);
PREPARE drop_sector_stmt FROM @drop_sector_column;
EXECUTE drop_sector_stmt;
DEALLOCATE PREPARE drop_sector_stmt;

SET @drop_industry_column = IF(
    EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
            AND table_name = 'security_details'
            AND column_name = 'industry'
    ),
    'ALTER TABLE security_details DROP COLUMN industry',
    'SELECT 1'
);
PREPARE drop_industry_stmt FROM @drop_industry_column;
EXECUTE drop_industry_stmt;
DEALLOCATE PREPARE drop_industry_stmt;
