package com.hexaware.portfolio.portfolio_backend.entity;

import java.time.Instant;

import com.hexaware.portfolio.portfolio_backend.entity.enums.BenchMark;
import com.hexaware.portfolio.portfolio_backend.entity.enums.Currency;
import com.hexaware.portfolio.portfolio_backend.entity.enums.Exchange;
import com.hexaware.portfolio.portfolio_backend.entity.enums.InvestmentThemes;
import com.hexaware.portfolio.portfolio_backend.entity.enums.PortfolioType;
import com.hexaware.portfolio.portfolio_backend.entity.enums.RebalanceFrequency;

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

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "portfolios")
public class Portfolio {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    private String name;

    @Enumerated(EnumType.STRING)
    private PortfolioType type;              // PERCENTAGE | RUPEE

    @Enumerated(EnumType.STRING)
    private Currency currency;               // INR | USD | GBP

    @Enumerated(EnumType.STRING)
    private BenchMark benchmerk;             // NIFTY50 | NASDAQ | SMP500

    @Enumerated(EnumType.STRING)
    private Exchange exchange;               // NSE | BSE

    @Enumerated(EnumType.STRING)
    private RebalanceFrequency rebalanceFrequency; // DAILY | WEEKLY | MONTHLY

    private Double amount;

    private boolean holdingsSaved;

    // ----- attached ONLY in Stage 2 -----
    @Enumerated(EnumType.STRING)
    private InvestmentThemes theme;           // null until theme saved

    private Instant createdAt;
    private Instant updatedAt;
}