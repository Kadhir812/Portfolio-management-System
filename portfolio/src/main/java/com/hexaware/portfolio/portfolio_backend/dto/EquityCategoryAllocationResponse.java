package com.hexaware.portfolio.portfolio_backend.dto;

import java.math.BigDecimal;

import com.hexaware.portfolio.portfolio_backend.entity.enums.EquityCategory;

public record EquityCategoryAllocationResponse(EquityCategory equityCategory, BigDecimal percentage) {}
