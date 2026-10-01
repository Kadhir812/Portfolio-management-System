package com.hexaware.portfolio.security.dto;

import com.hexaware.portfolio.security.entity.AssetClassMaster;

public record AssetClassMasterResponse(
        Long assetId,
        String assetClass,
        String assetDescription,
        String subAssetClass,
        String risk,
        String investmentHorizon,
        String subAssetDescription) {

    public static AssetClassMasterResponse from(AssetClassMaster asset) {
        return new AssetClassMasterResponse(
                asset.getAssetId(),
                asset.getAssetClass().name(),
                asset.getAssetDescription(),
                asset.getSubAssetClass(),
                asset.getRisk(),
                asset.getInvestmentHorizon(),
                asset.getSubAssetDescription());
    }
}