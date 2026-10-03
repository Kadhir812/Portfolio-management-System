-- Run once against an existing portfolio_db before starting the backend
-- after the AssetClass enum has been changed from STOCKS to EQUITY.

USE portfolio_db;

START TRANSACTION;

ALTER TABLE asset_class_master
    MODIFY asset_class ENUM(
        'EQUITY', 'STOCKS', 'MUTUAL_FUNDS', 'COMMODITIES',
        'BONDS', 'CRYPTO', 'REITS', 'ETFS', 'CASH'
    ) NOT NULL;

ALTER TABLE theme_allocations
    MODIFY asset_class ENUM(
        'EQUITY', 'STOCKS', 'MUTUAL_FUNDS', 'COMMODITIES',
        'BONDS', 'CRYPTO', 'REITS', 'ETFS', 'CASH'
    ) NOT NULL;
ALTER TABLE portfolio_holdings
    MODIFY asset_class ENUM(
        'EQUITY', 'STOCKS', 'MUTUAL_FUNDS', 'COMMODITIES',
        'BONDS', 'CRYPTO', 'REITS', 'ETFS', 'CASH'
    ) NOT NULL;
ALTER TABLE portfolio_trades
    MODIFY asset_class ENUM(
        'EQUITY', 'STOCKS', 'MUTUAL_FUNDS', 'COMMODITIES',
        'BONDS', 'CRYPTO', 'REITS', 'ETFS', 'CASH'
    ) NOT NULL;

UPDATE asset_class_master SET asset_class = 'EQUITY' WHERE asset_class = 'STOCKS';
UPDATE theme_allocations SET asset_class = 'EQUITY' WHERE asset_class = 'STOCKS';
UPDATE portfolio_holdings SET asset_class = 'EQUITY' WHERE asset_class = 'STOCKS';
UPDATE portfolio_trades SET asset_class = 'EQUITY' WHERE asset_class = 'STOCKS';

ALTER TABLE asset_class_master
    MODIFY asset_class ENUM(
        'EQUITY', 'MUTUAL_FUNDS', 'COMMODITIES',
        'BONDS', 'CRYPTO', 'REITS', 'ETFS', 'CASH'
    ) NOT NULL;

COMMIT;
