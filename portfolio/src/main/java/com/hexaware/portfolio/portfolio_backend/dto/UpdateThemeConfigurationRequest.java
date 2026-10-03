package com.hexaware.portfolio.portfolio_backend.dto;

import java.math.BigDecimal;
import java.util.List;

import com.hexaware.portfolio.portfolio_backend.entity.enums.AssetClass;
import com.hexaware.portfolio.security.entity.EquityCategory;

public record UpdateThemeConfigurationRequest(
        String label,
        String risk,
        String investmentHorizon,
        String description,
        List<Allocation> allocations,
        List<EquityAllocation> equityAllocations) {

    public record Allocation(AssetClass assetClass, BigDecimal percentage) {
    }

    public record EquityAllocation(EquityCategory equityCategory, BigDecimal percentage) {
    }
}
