package com.hexaware.portfolio.portfolio_backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.hexaware.portfolio.portfolio_backend.entity.enums.AssetClass;

public record EligibleSecurityResponse(
        String isin,
        String symbol,
        String description,
        AssetClass assetClass,
        BigDecimal latestPrice,
        LocalDate priceDate) {
}