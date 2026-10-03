package com.hexaware.portfolio.portfolio_backend.service.holdings;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.hexaware.portfolio.portfolio_backend.dto.AddSecurityRequest;
import com.hexaware.portfolio.portfolio_backend.dto.UpdateHoldingRequest;
import com.hexaware.portfolio.portfolio_backend.entity.Portfolio;
import com.hexaware.portfolio.portfolio_backend.entity.PortfolioHolding;
import com.hexaware.portfolio.portfolio_backend.entity.enums.AssetClass;
import com.hexaware.portfolio.portfolio_backend.entity.enums.PortfolioType;
import com.hexaware.portfolio.portfolio_backend.repository.PortfolioHoldingRepository;
import com.hexaware.portfolio.portfolio_backend.repository.PortfolioRepository;
import com.hexaware.portfolio.portfolio_backend.repository.PortfolioTradeRepository;
import com.hexaware.portfolio.portfolio_backend.repository.ThemeRepository;
import com.hexaware.portfolio.portfolio_backend.security.AppUser;
import com.hexaware.portfolio.portfolio_backend.security.CurrentUserService;
import com.hexaware.portfolio.security.entity.AssetType;
import com.hexaware.portfolio.security.entity.DailyPrice;
import com.hexaware.portfolio.security.entity.SecurityDetails;
import com.hexaware.portfolio.security.repository.DailyPriceRepository;
import com.hexaware.portfolio.security.repository.SecurityDetailsRepository;

@ExtendWith(MockitoExtension.class)
class PortfolioHoldingServiceCrudTest {

    @Mock
    private PortfolioRepository portfolios;
    @Mock
    private PortfolioHoldingRepository holdings;
    @Mock
    private PortfolioTradeRepository trades;
    @Mock
    private SecurityDetailsRepository securities;
    @Mock
    private DailyPriceRepository prices;
    @Mock
    private ThemeRepository themes;
    @Mock
    private CurrentUserService currentUser;
    @Mock
    private HoldingSecurityService securityService;
    @Mock
    private HoldingAllocationService allocationService;

    private PortfolioHoldingService service;
    private Portfolio portfolio;
    private SecurityDetails security;
    private DailyPrice price;

    @BeforeEach
    void setUp() {
        service = new PortfolioHoldingService(
                portfolios, holdings, trades, securities, prices, themes, currentUser,
                securityService, allocationService);

        AppUser user = AppUser.builder().username("owner").build();
        portfolio = Portfolio.builder()
                .id(10L)
                .owner(user)
                .type(PortfolioType.AMOUNT)
                .amount(new BigDecimal("10000.00"))
                .purchaseDate(LocalDate.of(2026, 1, 10))
                .holdingsSaved(false)
                .build();
        security = SecurityDetails.builder()
                .securityId(20L)
                .isin("INE123456789")
                .symbol("TEST")
                .name("Test Security")
                .assetType(AssetType.EQUITY)
                .build();
        price = DailyPrice.builder()
                .securityId(20L)
                .tradeDate(LocalDate.of(2026, 1, 10))
                .valuationPrice(new BigDecimal("125.50"))
                .build();

        when(currentUser.getCurrentUser()).thenReturn(user);
        when(portfolios.findByIdAndOwnerUsername(10L, "owner")).thenReturn(Optional.of(portfolio));
    }

    @Test
    void addSecurityPersistsMetadataAndCalculatedValue() {
                when(securities.findById(20L)).thenReturn(Optional.of(security));
                when(holdings.findByPortfolioId(10L)).thenReturn(List.of());
                when(securityService.assetClass(AssetType.EQUITY)).thenReturn(AssetClass.EQUITY);
                when(securityService.priceOnOrBefore(20L, portfolio.getPurchaseDate())).thenReturn(price);
                when(securityService.priceValue(price)).thenReturn(price.getValuationPrice());
                when(allocationService.allowedAssetClasses(portfolio)).thenReturn(Set.of());
                when(holdings.save(any(PortfolioHolding.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PortfolioHolding saved = service.addSecurity(10L,
                new AddSecurityRequest(20L, null, new BigDecimal("4")));

        assertNotNull(saved);
        assertEquals(10L, saved.getPortfolioId());
        assertEquals(20L, saved.getSecurityId());
        assertEquals(new BigDecimal("4"), saved.getShares());
        assertEquals(new BigDecimal("125.50"), saved.getPrice());
        assertEquals(new BigDecimal("502.00"), saved.getValue());
        assertEquals(AssetClass.EQUITY, saved.getAssetClass());
        verify(holdings).save(saved);
    }

    @Test
    void updateSharesRecalculatesHoldingValue() {
        PortfolioHolding existing = PortfolioHolding.builder()
                .id(30L)
                .portfolioId(10L)
                .securityId(20L)
                .shares(new BigDecimal("2"))
                .price(new BigDecimal("125.50"))
                .value(new BigDecimal("251.00"))
                .assetClass(AssetClass.EQUITY)
                .build();
        when(holdings.findByIdAndPortfolioId(30L, 10L)).thenReturn(Optional.of(existing));
        when(holdings.save(existing)).thenReturn(existing);

        PortfolioHolding updated = service.update(10L, 30L, new UpdateHoldingRequest(new BigDecimal("5")));

        assertEquals(new BigDecimal("5"), updated.getShares());
        assertEquals(new BigDecimal("627.50"), updated.getValue());
        verify(holdings).save(existing);
    }

    @Test
    void deleteRemovesHoldingFromRepository() {
        PortfolioHolding existing = PortfolioHolding.builder()
                .id(30L)
                .portfolioId(10L)
                .securityId(20L)
                .shares(new BigDecimal("2"))
                .price(new BigDecimal("125.50"))
                .value(new BigDecimal("251.00"))
                .assetClass(AssetClass.EQUITY)
                .build();
        when(holdings.findByIdAndPortfolioId(30L, 10L)).thenReturn(Optional.of(existing));

        service.delete(10L, 30L);

        verify(holdings).delete(existing);
    }
}