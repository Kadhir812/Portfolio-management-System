package com.hexaware.portfolio.portfolio_backend.exceptions;

public class SecurityNotFoundException extends RuntimeException {

    public SecurityNotFoundException(String isin) {
        super("Security not found: " + isin);
    }
}