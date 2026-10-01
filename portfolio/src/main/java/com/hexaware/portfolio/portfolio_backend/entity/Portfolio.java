package com.hexaware.portfolio.portfolio_backend.entity;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.hexaware.portfolio.portfolio_backend.entity.enums.BenchMark;
import com.hexaware.portfolio.portfolio_backend.entity.enums.Currency;
import com.hexaware.portfolio.portfolio_backend.entity.enums.Exchange;
import com.hexaware.portfolio.portfolio_backend.entity.enums.InvestmentThemes;
import com.hexaware.portfolio.portfolio_backend.entity.enums.PortfolioType;
import com.hexaware.portfolio.portfolio_backend.entity.enums.RebalanceFrequency;
import com.hexaware.portfolio.portfolio_backend.security.AppUser;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.Check;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "portfolios")
@Check(name = "ck_portfolios_amount_nonnegative", constraints = "amount >= 0")
public class Portfolio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
        @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_portfolios_user"))
    private AppUser owner;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PortfolioType type;              // PERCENTAGE | RUPEE

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Currency currency;               // INR | USD | GBP

    @Enumerated(EnumType.STRING)
    @Column(name = "benchmark", nullable = false)
    private BenchMark benchmark;             // NIFTY50 | NASDAQ | SMP500

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Exchange exchange;               // NSE | BSE

    @Enumerated(EnumType.STRING)
    @Column(name = "rebalance_frequency", nullable = false)
    private RebalanceFrequency rebalanceFrequency; // DAILY | WEEKLY | MONTHLY

    @Column(nullable = false, precision = 20, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "theme", length = 40)
    private InvestmentThemes theme;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "theme", referencedColumnName = "theme_code", insertable = false, updatable = false,
            foreignKey = @ForeignKey(name = "fk_portfolios_theme"))
    private ThemeDefinition themeDefinition;

    @Column(name = "purchase_date", nullable = false)
    private LocalDate purchaseDate;

    private boolean holdingsSaved;

    private Instant createdAt;
    private Instant updatedAt;
}
