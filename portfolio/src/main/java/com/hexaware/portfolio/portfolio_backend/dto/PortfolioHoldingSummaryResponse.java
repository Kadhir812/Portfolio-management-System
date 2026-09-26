package com.hexaware.portfolio.portfolio_backend.dto;

import java.math.BigDecimal;

public record PortfolioHoldingSummaryResponse(
        long holdingCount,
        BigDecimal totalValue) {
}