package com.hexaware.portfolio.portfolio_backend.exceptions;

public class ThemeNotAttachedException extends RuntimeException {

    public ThemeNotAttachedException(Long portfolioId) {
        super("No investment theme is attached to portfolio: " + portfolioId);
    }
}