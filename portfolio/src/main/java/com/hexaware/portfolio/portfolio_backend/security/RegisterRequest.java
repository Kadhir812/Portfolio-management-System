package com.hexaware.portfolio.portfolio_backend.security;

public record RegisterRequest(
        String email,
        String username,
        String password) {
}
