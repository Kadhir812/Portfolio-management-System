package com.hexaware.portfolio.portfolio_backend.dto;

import java.math.BigDecimal;
import com.hexaware.portfolio.portfolio_backend.entity.enums.AssetClass;

public record ThemeAllocationResponse(
        AssetClass assetClass,
        BigDecimal percentage) {
}