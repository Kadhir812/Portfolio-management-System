package com.hexaware.portfolio.portfolio_backend.exceptions;

public class PortfolioNotFoundException extends RuntimeException {

    public PortfolioNotFoundException(String id) {
        super("Portfolio not found: " + id);
    }
}