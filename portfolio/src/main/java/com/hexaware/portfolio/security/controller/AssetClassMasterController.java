package com.hexaware.portfolio.security.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hexaware.portfolio.security.dto.AssetClassMasterResponse;
import com.hexaware.portfolio.security.dto.AssetClassMasterRequest;
import com.hexaware.portfolio.security.service.AssetClassMasterService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/asset-classes")
@RequiredArgsConstructor
public class AssetClassMasterController {
    private final AssetClassMasterService assets;

    @GetMapping
    public ResponseEntity<List<AssetClassMasterResponse>> list() {
        return ResponseEntity.ok(assets.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AssetClassMasterResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(assets.findById(id));
    }

    @PostMapping
    public ResponseEntity<AssetClassMasterResponse> create(@RequestBody AssetClassMasterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(assets.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AssetClassMasterResponse> update(
            @PathVariable Long id, @RequestBody AssetClassMasterRequest request) {
        return ResponseEntity.ok(assets.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        assets.delete(id);
        return ResponseEntity.noContent().build();
    }
}