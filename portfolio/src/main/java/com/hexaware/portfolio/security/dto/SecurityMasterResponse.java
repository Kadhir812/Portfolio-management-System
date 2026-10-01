package com.hexaware.portfolio.security.dto;

import com.hexaware.portfolio.security.entity.SecurityDetails;

public record SecurityMasterResponse(
        Long securityId,
        String isin,
        String cupid,
        String symbol,
        String series,
        String description,
        String exchange,
        String country,
        String currency,
        String name,
        String assetType,
        String status,
        String gicsSectorCode,
        String gicsSectorName,
        String gicsIndustryCode,
        String gicsIndustryName) {

    public static SecurityMasterResponse from(SecurityDetails security) {
        return new SecurityMasterResponse(
                security.getSecurityId(),
                security.getIsin(),
                security.getCupid(),
                security.getSymbol(),
                security.getSeries(),
                security.getDescription(),
                security.getExchange(),
                security.getCountry(),
                security.getCurrency(),
                security.getName(),
                security.getAssetType() == null ? null : security.getAssetType().name(),
                security.getStatus(),
                security.getGicsIndustry() == null ? null : security.getGicsIndustry().getSectorCode(),
                security.getGicsIndustry() == null ? null : security.getGicsIndustry().getSectorName(),
                security.getGicsIndustryCode(),
                security.getGicsIndustry() == null ? null : security.getGicsIndustry().getIndustryName());
    }
}