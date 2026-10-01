package com.hexaware.portfolio.portfolio_backend.dto;

import java.math.BigDecimal;
import com.hexaware.portfolio.portfolio_backend.entity.enums.BenchMark;
import com.hexaware.portfolio.portfolio_backend.entity.enums.Currency;
import com.hexaware.portfolio.portfolio_backend.entity.enums.Exchange;
import com.hexaware.portfolio.portfolio_backend.entity.enums.PortfolioType;
import com.hexaware.portfolio.portfolio_backend.entity.enums.RebalanceFrequency;
import java.time.LocalDate;

public record CreatePortfolioRequest(
        String name,
        PortfolioType type,
        Currency currency,
        BenchMark benchmark,
        Exchange exchange,
        RebalanceFrequency rebalanceFrequency,
        BigDecimal amount,
        LocalDate purchaseDate) {
}
