package com.hexaware.portfolio.portfolio_backend.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import com.hexaware.portfolio.portfolio_backend.entity.enums.AssetClass;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AsssetAllocation {

    private AssetClass assetClass;
    private Double percent;        
}