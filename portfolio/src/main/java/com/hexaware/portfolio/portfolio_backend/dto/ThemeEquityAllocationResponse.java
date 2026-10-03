package com.hexaware.portfolio.portfolio_backend.dto;

import java.math.BigDecimal;

import com.hexaware.portfolio.security.entity.EquityCategory;

public record ThemeEquityAllocationResponse(
        EquityCategory equityCategory,
        BigDecimal percentage) {
}