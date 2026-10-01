package com.hexaware.portfolio.security.dto;

import com.hexaware.portfolio.security.entity.SecurityDetails;
import com.hexaware.portfolio.security.entity.EquityCategory;

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
        String gicsIndustryName,
        String assetClass,
        String assetDescription,
        String subAssetClass,
        String risk,
        String investmentHorizon,
        String subAssetDescription,
        EquityCategory equityCategory) {

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
                security.getGicsIndustry() == null ? null : security.getGicsIndustry().getIndustryName(),
                security.getAssetClassMaster() == null ? null : security.getAssetClassMaster().getAssetClass().name(),
                security.getAssetClassMaster() == null ? null : security.getAssetClassMaster().getAssetDescription(),
                security.getAssetClassMaster() == null ? null : security.getAssetClassMaster().getSubAssetClass(),
                security.getAssetClassMaster() == null ? null : security.getAssetClassMaster().getRisk(),
                security.getAssetClassMaster() == null ? null : security.getAssetClassMaster().getInvestmentHorizon(),
                security.getAssetClassMaster() == null ? null : security.getAssetClassMaster().getSubAssetDescription(),
                security.getEquityCategory());
    }
}