package com.hexaware.portfolio.portfolio_backend.dto;

import com.hexaware.portfolio.portfolio_backend.entity.enums.InvestmentThemes;

public record AttachThemeRequest(InvestmentThemes theme) {
}