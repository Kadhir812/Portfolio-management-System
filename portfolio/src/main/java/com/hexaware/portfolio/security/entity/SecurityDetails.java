package com.hexaware.portfolio.security.entity;

import java.time.LocalDateTime;

import com.hexaware.portfolio.portfolio_backend.entity.enums.EquityCategory;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "security_details")
@Data
@NoArgsConstructor
public class SecurityDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "security_id")
    private Long securityId;

    @Enumerated(EnumType.STRING)
    @Column(name = "asset_type", nullable = false, length = 20, columnDefinition = "varchar(20)")
    private AssetType assetType;

    @Enumerated(EnumType.STRING)
    @Column(name = "equity_category", length = 30)
    private EquityCategory equityCategory;

    @Column(name = "isin", unique = true, length = 12)
    private String isin;

    @Column(name = "symbol", length = 50)
    private String symbol;

    @Column(name = "series", length = 10)
    private String series;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "exchange", length = 30)
    private String exchange;

    @Column(name = "currency", length = 10)
    private String currency;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gics_industry_code", referencedColumnName = "industry_code")
    private GicsIndustry gicsIndustry;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Column(name = "website_url", length = 500)
    private String websiteUrl;

    @Column(name = "country", length = 100)
    private String country;

    @Column(name = "market", length = 100)
    private String market;

    @Column(name = "risk_level", length = 30)
    private String riskLevel;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public String getSymbolAndSeries() {
        return symbol + "/" + series;
    }
}
