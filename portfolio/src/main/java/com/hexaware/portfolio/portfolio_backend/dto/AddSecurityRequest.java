package com.hexaware.portfolio.portfolio_backend.dto;

import java.math.BigDecimal;

public record AddSecurityRequest(
        String isin,
        BigDecimal shares) {
}