package com.hexaware.portfolio.portfolio_backend.security;

public record LoginRequest(
        String username,
        String password) {
}
