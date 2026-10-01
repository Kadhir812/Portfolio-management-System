package com.hexaware.portfolio.security.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hexaware.portfolio.security.dto.AssetClassMasterResponse;
import com.hexaware.portfolio.security.service.AssetClassMasterService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/asset-classes")
@RequiredArgsConstructor
public class AssetClassMasterController {
    private final AssetClassMasterService assets;

    @GetMapping
    public List<AssetClassMasterResponse> list() {
        return assets.findAll();
    }
}