package com.hexaware.portfolio.portfolio_backend.repository;

import static org.junit.jupiter.api.Assertions.assertThrows;

import java.math.BigDecimal;
import java.time.LocalDate;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.annotation.Transactional;

import com.hexaware.portfolio.portfolio_backend.entity.PortfolioHolding;
import com.hexaware.portfolio.portfolio_backend.entity.enums.AssetClass;

@SpringBootTest
@Transactional
class PortfolioHoldingForeignKeyTest {

    @Autowired
    private PortfolioHoldingRepository holdings;

    @Test
    void rejectsHoldingWithUnknownPortfolio() {
        PortfolioHolding holding = validHolding();
        holding.setPortfolioId(Long.MAX_VALUE);

        assertThrows(DataIntegrityViolationException.class, () -> holdings.saveAndFlush(holding));
    }

    @Test
    void rejectsHoldingWithUnknownSecurity() {
        PortfolioHolding holding = validHolding();
        holding.setSecurityId(Long.MAX_VALUE - 1);

        assertThrows(DataIntegrityViolationException.class, () -> holdings.saveAndFlush(holding));
    }

    private PortfolioHolding validHolding() {
        return PortfolioHolding.builder()
                .portfolioId(0L)
                .securityId(0L)
                .securityName("Foreign key test")
                .assetClass(AssetClass.EQUITY)
                .shares(BigDecimal.ONE)
                .price(BigDecimal.TEN)
                .value(BigDecimal.TEN)
                .priceDate(LocalDate.of(2026, 1, 1))
                .build();
    }
}