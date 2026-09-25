package com.hexaware.portfolio.security.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "stocks_master")
@Data 
@NoArgsConstructor
public class SecurityDetails {

    @Id
    @Column(name = "isin", nullable = false, length = 12)
    private String isin;

    @Column(name = "symbol", nullable = false, length = 20)
    private String symbol;

    @Column(name = "series", nullable = false, length = 5)
    private String series;

    @Column(name = "description", nullable = false, length = 200)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "asset_type", nullable = false, length = 20)
    private AssetType assetType;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void touch() {
        this.updatedAt = LocalDateTime.now();
    }

    public String getSymbolAndSeries() {
        return symbol + "/" + series;
    }
}