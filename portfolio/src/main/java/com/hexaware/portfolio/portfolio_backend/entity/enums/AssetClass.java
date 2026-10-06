package com.hexaware.portfolio.portfolio_backend.entity.enums;

import com.hexaware.portfolio.security.entity.AssetType;

public enum AssetClass { 
    STOCKS,
    MUTUAL_FUNDS,
    COMMODITIES,
    BONDS,
    CRYPTO,
    REITS,
    ETFS,
    CASH;

    public static AssetClass from(AssetType assetType) {
        if (assetType == null) {
            return null;
        }
        return switch (assetType) {
            case EQUITY -> STOCKS;
            case MUTUAL -> MUTUAL_FUNDS;
            case COMMODITY -> COMMODITIES;
            case BOND -> BONDS;
            case CRYPTO -> CRYPTO;
            case REIT -> REITS;
            case ETF -> ETFS;
            case CASH -> CASH;
        };
    }
}