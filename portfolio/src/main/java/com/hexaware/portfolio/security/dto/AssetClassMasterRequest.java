package com.hexaware.portfolio.security.dto;

public record AssetClassMasterRequest(
        String assetClass,
        String assetDescription,
        String subAssetClass,
        String risk,
        String investmentHorizon,
        String subAssetDescription) {
}