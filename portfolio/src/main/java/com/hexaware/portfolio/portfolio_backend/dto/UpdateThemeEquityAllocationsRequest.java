package com.hexaware.portfolio.portfolio_backend.dto;

import java.math.BigDecimal;
import java.util.List;

import com.hexaware.portfolio.security.entity.EquityCategory;

public record UpdateThemeEquityAllocationsRequest(
        List<Allocation> allocations) {

    public record Allocation(
            EquityCategory equityCategory,
            BigDecimal percentage) {
    }
}