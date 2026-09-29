package com.hexaware.portfolio.portfolio_backend.entity;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "portfolio_trades", indexes = @Index(name = "idx_portfolio_trade_date", columnList = "portfolio_id, trade_date"))
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class PortfolioTrade {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "portfolio_id", nullable = false)
    private Long portfolioId;
    @Column(nullable = false)
    private String isin;
    private String symbol;
    @Column(name = "security_name")
    private String securityName;
    @Enumerated(EnumType.STRING)
    @Column(name = "asset_class", nullable = false)
    private com.hexaware.portfolio.portfolio_backend.entity.enums.AssetClass assetClass;
    @Column(name = "signed_shares", nullable = false, precision = 24, scale = 8)
    private BigDecimal signedShares;
    @Column(name = "unit_price", nullable = false, precision = 20, scale = 6)
    private BigDecimal unitPrice;
    @Column(name = "trade_date", nullable = false)
    private LocalDate tradeDate;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
}
