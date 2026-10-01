package com.hexaware.portfolio.security.entity;

import com.hexaware.portfolio.portfolio_backend.entity.enums.AssetClass;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "asset_class_master", uniqueConstraints = @UniqueConstraint(
        name = "uk_asset_class_master_class_subclass", columnNames = { "asset_class", "sub_asset_class" }))
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AssetClassMaster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "asset_id")
    private Long assetId;

    @Enumerated(EnumType.STRING)
    @Column(name = "asset_class", nullable = false, length = 40)
    private AssetClass assetClass;

    @Column(name = "asset_description", nullable = false, length = 500)
    private String assetDescription;

    @Column(name = "sub_asset_class", nullable = false, length = 100)
    private String subAssetClass;

    @Column(name = "risk", nullable = false, length = 40)
    private String risk;

    @Column(name = "investment_horizon", nullable = false, length = 60)
    private String investmentHorizon;

    @Column(name = "sub_asset_description", nullable = false, length = 500)
    private String subAssetDescription;
}