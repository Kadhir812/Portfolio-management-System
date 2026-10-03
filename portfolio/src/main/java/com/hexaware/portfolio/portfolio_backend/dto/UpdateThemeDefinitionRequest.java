package com.hexaware.portfolio.portfolio_backend.dto;

import java.math.BigDecimal;
import java.util.List;

import com.hexaware.portfolio.portfolio_backend.entity.enums.AssetClass;

public record UpdateThemeDefinitionRequest(
        String label,
        String risk,
        String investmentHorizon,
        String description,
        List<Allocation> allocations) {

    public record Allocation(
            AssetClass assetClass,
            BigDecimal percentage) {
    }
}