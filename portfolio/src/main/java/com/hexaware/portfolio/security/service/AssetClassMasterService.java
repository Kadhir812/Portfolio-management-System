package com.hexaware.portfolio.security.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.hexaware.portfolio.portfolio_backend.exceptions.AssetClassNotFoundException;
import com.hexaware.portfolio.portfolio_backend.exceptions.PortfolioValidationException;
import com.hexaware.portfolio.portfolio_backend.entity.enums.AssetClass;
import com.hexaware.portfolio.security.dto.AssetClassMasterRequest;
import com.hexaware.portfolio.security.dto.AssetClassMasterResponse;
import com.hexaware.portfolio.security.entity.AssetClassMaster;
import com.hexaware.portfolio.security.repository.AssetClassMasterRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AssetClassMasterService {
    private final AssetClassMasterRepository assets;

    public List<AssetClassMasterResponse> findAll() {
        return assets.findAllByOrderByAssetClassAscSubAssetClassAsc().stream()
                .map(AssetClassMasterResponse::from)
                .toList();
    }

    public AssetClassMasterResponse findById(Long id) {
        return assets.findById(id)
                .map(AssetClassMasterResponse::from)
                .orElseThrow(() -> new AssetClassNotFoundException(id));
    }

    public AssetClassMasterResponse create(AssetClassMasterRequest request) {
        validate(request);
        AssetClassMaster asset = new AssetClassMaster();
        apply(asset, request);
        return AssetClassMasterResponse.from(assets.save(asset));
    }

    public AssetClassMasterResponse update(Long id, AssetClassMasterRequest request) {
        validate(request);
        AssetClassMaster asset = assets.findById(id)
                .orElseThrow(() -> new AssetClassNotFoundException(id));
        apply(asset, request);
        return AssetClassMasterResponse.from(assets.save(asset));
    }

    public void delete(Long id) {
        AssetClassMaster asset = assets.findById(id)
                .orElseThrow(() -> new AssetClassNotFoundException(id));
        assets.delete(asset);
    }

    private void apply(AssetClassMaster asset, AssetClassMasterRequest request) {
        asset.setAssetClass(AssetClass.valueOf(request.assetClass().trim().toUpperCase()));
        asset.setAssetDescription(request.assetDescription().trim());
        asset.setSubAssetClass(request.subAssetClass().trim());
        asset.setRisk(request.risk().trim());
        asset.setInvestmentHorizon(request.investmentHorizon().trim());
        asset.setSubAssetDescription(request.subAssetDescription().trim());
    }

    private void validate(AssetClassMasterRequest request) {
        if (request == null || request.assetClass() == null || request.assetDescription() == null
                || request.subAssetClass() == null || request.risk() == null
                || request.investmentHorizon() == null || request.subAssetDescription() == null
                || request.assetClass().isBlank() || request.assetDescription().isBlank()
                || request.subAssetClass().isBlank() || request.risk().isBlank()
                || request.investmentHorizon().isBlank() || request.subAssetDescription().isBlank()) {
            throw new PortfolioValidationException("All asset class fields are required");
        }
        try {
            AssetClass.valueOf(request.assetClass().trim().toUpperCase());
        } catch (IllegalArgumentException exception) {
            throw new PortfolioValidationException("Unknown asset class: " + request.assetClass());
        }
    }
}