package com.hexaware.portfolio.security.dto;

import com.hexaware.portfolio.security.entity.SecurityDetails;

public record SecurityMasterResponse(
        Long securityId,
        String isin,
        String symbol,
        String series,
        String description,
        String exchange,
        String country,
        String currency,
        String name,
        String assetType,
        String status) {

    public static SecurityMasterResponse from(SecurityDetails security) {
        return new SecurityMasterResponse(
                security.getSecurityId(),
                security.getIsin(),
                security.getSymbol(),
                security.getSeries(),
                security.getDescription(),
                security.getExchange(),
                security.getCountry(),
                security.getCurrency(),
                security.getName(),
                security.getAssetType() == null ? null : security.getAssetType().name(),
                security.getStatus());
    }
}