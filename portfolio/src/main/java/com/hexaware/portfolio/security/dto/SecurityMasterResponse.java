package com.hexaware.portfolio.security.dto;

import com.hexaware.portfolio.security.entity.SecurityDetails;
import com.hexaware.portfolio.portfolio_backend.entity.enums.AssetClass;
import com.hexaware.portfolio.portfolio_backend.entity.enums.EquityCategory;

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
        AssetClass assetClass,
        EquityCategory equityCategory,
        String sector,
        String industry,
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
                AssetClass.from(security.getAssetType()),
                security.getEquityCategory(),
                security.getGicsIndustry() == null ? null : security.getGicsIndustry().getSectorName(),
                security.getGicsIndustry() == null ? null : security.getGicsIndustry().getIndustryName(),
                security.getStatus());
    }
}
