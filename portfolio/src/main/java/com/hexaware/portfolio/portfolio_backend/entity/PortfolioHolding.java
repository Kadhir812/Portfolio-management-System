package com.hexaware.portfolio.portfolio_backend.entity;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;


import com.hexaware.portfolio.portfolio_backend.entity.enums.AssetClass;


import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "portfolio_holdings")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PortfolioHolding {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "portfolio_id", nullable = false)
    private Long portfolioId;

    private String isin;
    private String securityName;
    private String symbol;

    @Enumerated(EnumType.STRING)
    private AssetClass assetClass;

    private BigDecimal shares;
    private BigDecimal price;
    private BigDecimal value;
    private LocalDate priceDate;
    private Instant createdAt;
    private Instant updatedAt;
}