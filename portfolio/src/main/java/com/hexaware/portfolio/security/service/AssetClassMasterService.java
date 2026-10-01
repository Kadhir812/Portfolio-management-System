package com.hexaware.portfolio.security.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.hexaware.portfolio.security.dto.AssetClassMasterResponse;
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
}