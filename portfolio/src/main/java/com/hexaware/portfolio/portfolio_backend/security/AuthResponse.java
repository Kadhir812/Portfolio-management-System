package com.hexaware.portfolio.portfolio_backend.security;

public record AuthResponse(
        Long id,
        String email,
        String username,
        String token) {
}
