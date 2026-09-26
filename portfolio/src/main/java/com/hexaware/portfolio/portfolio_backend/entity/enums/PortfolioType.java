package com.hexaware.portfolio.portfolio_backend.entity.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum PortfolioType {
    PERCENTAGE,
    RUPEE,
    WEIGHTAGE,
    AMOUNT;

    @JsonCreator
    public static PortfolioType fromValue(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        if (normalized.isEmpty()) {
            return null;
        }
        return switch (normalized.toUpperCase()) {
            case "PERCENTAGE" -> PERCENTAGE;
            case "RUPEE" -> RUPEE;
            case "WEIGHTAGE" -> WEIGHTAGE;
            case "AMOUNT" -> AMOUNT;
            default -> throw new IllegalArgumentException("Unsupported portfolio type: " + value);
        };
    }

    @JsonValue
    public String toJson() {
        return this.name();
    }
}