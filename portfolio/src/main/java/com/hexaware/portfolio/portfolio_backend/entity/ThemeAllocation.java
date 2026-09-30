package com.hexaware.portfolio.portfolio_backend.entity;

import com.hexaware.portfolio.portfolio_backend.entity.enums.AssetClass;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Column;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "theme_allocations")
@Getter
@Setter
@NoArgsConstructor
public class ThemeAllocation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "theme_id", nullable = false)
    private ThemeDefinition theme;

    @Enumerated(EnumType.STRING)
    @Column(name = "asset_class", nullable = false, length = 40)
    private AssetClass assetClass;

    @Column(nullable = false)
    private Double percentage;
}