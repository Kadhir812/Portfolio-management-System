package com.hexaware.portfolio.portfolio_backend.service.holdings;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.hexaware.portfolio.portfolio_backend.entity.Portfolio;
import com.hexaware.portfolio.portfolio_backend.entity.PortfolioHolding;
import com.hexaware.portfolio.portfolio_backend.entity.ThemeAllocation;
import com.hexaware.portfolio.portfolio_backend.entity.ThemeDefinition;
import com.hexaware.portfolio.portfolio_backend.entity.enums.AssetClass;
import com.hexaware.portfolio.portfolio_backend.entity.enums.InvestmentThemes;
import com.hexaware.portfolio.portfolio_backend.exceptions.PortfolioValidationException;
import com.hexaware.portfolio.portfolio_backend.repository.PortfolioHoldingRepository;
import com.hexaware.portfolio.portfolio_backend.repository.ThemeRepository;

class HoldingAllocationServiceTest {
    private PortfolioHoldingRepository holdings;
    private ThemeRepository themes;
    private HoldingAllocationService service;

    @BeforeEach
    void setUp() {
        holdings = mock(PortfolioHoldingRepository.class);
        themes = mock(ThemeRepository.class);
        service = new HoldingAllocationService(holdings, themes);
    }

    @Test
    void portfolioWithoutThemeAllowsAllAssetClasses() {
        Portfolio portfolio = Portfolio.builder().id(1L).build();

        assertEquals(Set.of(), service.allowedAssetClasses(portfolio));
        service.ensureDoesNotExceedTarget(portfolio, AssetClass.STOCKS, BigDecimal.TEN, null);

        verify(themes, never()).findByTheme(org.mockito.ArgumentMatchers.any());
        verify(holdings, never()).findByPortfolioId(1L);
    }

    @Test
    void readsAllowedClassesFromPortfolioTheme() {
        Portfolio portfolio = portfolio();
        when(themes.findByTheme(InvestmentThemes.AGGRESSIVE))
                .thenReturn(Optional.of(theme(allocation(AssetClass.STOCKS, "60"),
                        allocation(AssetClass.CRYPTO, "10"))));

        assertEquals(Set.of(AssetClass.STOCKS, AssetClass.CRYPTO), service.allowedAssetClasses(portfolio));
    }

    @Test
    void missingThemeDefinitionProducesValidationError() {
        when(themes.findByTheme(InvestmentThemes.AGGRESSIVE)).thenReturn(Optional.empty());

        assertThrows(PortfolioValidationException.class, () -> service.allowedAssetClasses(portfolio()));
        assertThrows(PortfolioValidationException.class,
                () -> service.ensureDoesNotExceedTarget(portfolio(), AssetClass.STOCKS, BigDecimal.ONE, null));
    }

    @Test
    void rejectsAllocationThatExceedsTargetAndAllowsWithinLimit() {
        Portfolio portfolio = portfolio();
        when(themes.findByTheme(InvestmentThemes.AGGRESSIVE))
                .thenReturn(Optional.of(theme(allocation(AssetClass.STOCKS, "50"))));
        when(holdings.findByPortfolioId(1L)).thenReturn(List.of(
                PortfolioHolding.builder().assetClass(AssetClass.STOCKS).value(new BigDecimal("40")).build()));

        service.ensureDoesNotExceedTarget(portfolio, AssetClass.STOCKS, new BigDecimal("10"), null);
        assertThrows(PortfolioValidationException.class,
                () -> service.ensureDoesNotExceedTarget(portfolio, AssetClass.STOCKS, new BigDecimal("12"), null));
    }

    @Test
    void cashTargetIncludesUnallocatedPortfolioResidual() {
        Portfolio portfolio = portfolio();
        when(themes.findByTheme(InvestmentThemes.AGGRESSIVE))
                .thenReturn(Optional.of(theme(allocation(AssetClass.CASH, "10"))));
        when(holdings.findByPortfolioId(1L)).thenReturn(List.of(
                PortfolioHolding.builder().assetClass(AssetClass.STOCKS).value(new BigDecimal("85")).build(),
                PortfolioHolding.builder().assetClass(AssetClass.CASH).value(new BigDecimal("5")).build()));

        assertThrows(PortfolioValidationException.class,
                () -> service.ensureDoesNotExceedTarget(portfolio, AssetClass.CASH, BigDecimal.ONE, null));
    }

    private Portfolio portfolio() {
        return Portfolio.builder().id(1L).theme(InvestmentThemes.AGGRESSIVE).amount(new BigDecimal("100")).build();
    }

    private ThemeDefinition theme(ThemeAllocation... allocations) {
        ThemeDefinition theme = new ThemeDefinition();
        theme.setTheme(InvestmentThemes.AGGRESSIVE);
        for (ThemeAllocation allocation : allocations) theme.addAllocation(allocation);
        return theme;
    }

    private ThemeAllocation allocation(AssetClass assetClass, String percentage) {
        ThemeAllocation allocation = new ThemeAllocation();
        allocation.setAssetClass(assetClass);
        allocation.setPercentage(new BigDecimal(percentage));
        return allocation;
    }
}