package com.hexaware.portfolio.portfolio_backend.exceptions;

public class AssetClassNotFoundException extends RuntimeException {

    public AssetClassNotFoundException(Long id) {
        super("Asset class not found: " + id);
    }
}
