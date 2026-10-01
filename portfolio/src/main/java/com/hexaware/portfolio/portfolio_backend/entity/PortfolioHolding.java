package com.hexaware.portfolio.portfolio_backend.entity;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import org.hibernate.annotations.Check;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.hexaware.portfolio.security.entity.SecurityDetails;


import com.hexaware.portfolio.portfolio_backend.entity.enums.AssetClass;


import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "portfolio_holdings", uniqueConstraints = @UniqueConstraint(
    name = "uk_portfolio_holdings_portfolio_security", columnNames = { "portfolio_id", "security_id" }))
@Check(name = "ck_portfolio_holdings_positive_values", constraints = "shares > 0 AND price > 0 AND value >= 0")
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

    @Column(name = "security_id", nullable = false)
    private Long securityId;

    @JsonIgnore
    @ManyToOne(fetch = jakarta.persistence.FetchType.LAZY, optional = false)
    @JoinColumn(name = "portfolio_id", nullable = false, insertable = false, updatable = false,
            foreignKey = @ForeignKey(name = "fk_portfolio_holdings_portfolio"))
    private Portfolio portfolio;

    @JsonIgnore
    @ManyToOne(fetch = jakarta.persistence.FetchType.LAZY, optional = false)
    @JoinColumn(name = "security_id", nullable = false, insertable = false, updatable = false,
            foreignKey = @ForeignKey(name = "fk_portfolio_holdings_security"))
    private SecurityDetails security;
    private String isin;
    private String securityName;
    private String symbol;

    @Enumerated(EnumType.STRING)
    @Column(name = "asset_class", nullable = false, length = 40)
    private AssetClass assetClass;

    @Column(nullable = false, precision = 24, scale = 8)
    private BigDecimal shares;
    @Column(nullable = false, precision = 20, scale = 6)
    private BigDecimal price;
    @Column(nullable = false, precision = 20, scale = 2)
    private BigDecimal value;
    @Column(name = "price_date", nullable = false)
    private LocalDate priceDate;
    @Column(name = "created_at")
    private Instant createdAt;
    @Column(name = "updated_at")
    private Instant updatedAt;
}