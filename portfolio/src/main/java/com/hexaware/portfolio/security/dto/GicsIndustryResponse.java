package com.hexaware.portfolio.security.dto;

public record GicsIndustryResponse(
        String code,
        String name,
        String sectorCode,
        String sectorName) {
}