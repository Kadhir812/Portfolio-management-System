package com.hexaware.portfolio.portfolio_backend.entity.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum RebalanceFrequency {
    DAILY,
    WEEKLY,
    MONTHLY,
    QUARTERLY;

    @JsonCreator
    public static RebalanceFrequency fromValue(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        if (normalized.isEmpty()) {
            return null;
        }
        return switch (normalized.toUpperCase()) {
            case "DAILY" -> DAILY;
            case "WEEKLY" -> WEEKLY;
            case "MONTHLY" -> MONTHLY;
            case "QUARTERLY" -> QUARTERLY;
            default -> throw new IllegalArgumentException("Unsupported rebalance frequency: " + value);
        };
    }

    @JsonValue
    public String toJson() {
        return this.name();
    }
}