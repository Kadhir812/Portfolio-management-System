package com.hexaware.portfolio.portfolio_backend.dto;

import java.util.List;

import com.hexaware.portfolio.portfolio_backend.entity.enums.InvestmentThemes;

public record ThemeDefinitionResponse(
        InvestmentThemes theme,
        String label,
        List<ThemeAllocationResponse> allocations,
        String risk,
        String investmentHorizon,
        String description) {
}