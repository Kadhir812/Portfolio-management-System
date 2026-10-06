package com.hexaware.portfolio.portfolio_backend.entity;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.hexaware.portfolio.portfolio_backend.entity.enums.AssetClass;
import com.hexaware.portfolio.portfolio_backend.entity.enums.EquityCategory;
import com.hexaware.portfolio.security.entity.SecurityDetails;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.Check;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "portfolio_trades", indexes = @Index(name = "idx_portfolio_trade_date", columnList = "portfolio_id, trade_date"))
@Check(name = "ck_portfolio_trades_valid_values", constraints = "signed_shares <> 0 AND unit_price > 0")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PortfolioTrade {
        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "portfolio_id", nullable = false)
    private Long portfolioId;

    @Column(name = "security_id", nullable = false)
    private Long securityId;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "portfolio_id", nullable = false, insertable = false, updatable = false,
            foreignKey = @ForeignKey(name = "fk_portfolio_trades_portfolio"))
    private Portfolio portfolio;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "security_id", nullable = false, insertable = false, updatable = false,
            foreignKey = @ForeignKey(name = "fk_portfolio_trades_security"))
    private SecurityDetails security;
    private String isin;
    private String symbol;
    @Column(name = "security_name")
    private String securityName;
    @Enumerated(EnumType.STRING)
    @Column(name = "asset_class", nullable = false)
    private AssetClass assetClass;
    @Enumerated(EnumType.STRING)
    @Column(name = "equity_category", length = 30)
    private EquityCategory equityCategory;
    @Column(name = "signed_shares", nullable = false, precision = 24, scale = 8)
    private BigDecimal signedShares;
    @Column(name = "unit_price", nullable = false, precision = 20, scale = 6)
    private BigDecimal unitPrice;
    @Column(name = "trade_date", nullable = false)
    private LocalDate tradeDate;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
}
