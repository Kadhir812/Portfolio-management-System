package com.hexaware.portfolio.portfolio_backend.dto;

import com.hexaware.portfolio.portfolio_backend.entity.enums.AssetClass;

public record ThemeAllocationResponse(
        AssetClass assetClass,
        Double percentage) {
}