package com.hexaware.portfolio.portfolio_backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.hexaware.portfolio.portfolio_backend.entity.enums.AssetClass;
import com.hexaware.portfolio.security.entity.EquityCategory;

public record EligibleSecurityResponse(
        Long securityId,
        String isin,
        String symbol,
        String name,
        String description,
        AssetClass assetClass,
        String masterAssetClass,
        String subAssetClass,
        EquityCategory equityCategory,
        BigDecimal latestPrice,
        LocalDate priceDate) {
}