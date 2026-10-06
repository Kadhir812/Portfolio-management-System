package com.hexaware.portfolio.portfolio_backend.service.holdings;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.hexaware.portfolio.portfolio_backend.entity.PortfolioHolding;
import com.hexaware.portfolio.portfolio_backend.entity.PortfolioTrade;
import com.hexaware.portfolio.portfolio_backend.entity.enums.AssetClass;
import com.hexaware.portfolio.portfolio_backend.exceptions.PortfolioValidationException;
import com.hexaware.portfolio.portfolio_backend.exceptions.SecurityNotFoundException;
import com.hexaware.portfolio.security.entity.AssetType;
import com.hexaware.portfolio.security.entity.DailyPrice;
import com.hexaware.portfolio.security.entity.SecurityDetails;
import com.hexaware.portfolio.security.repository.DailyPriceRepository;
import com.hexaware.portfolio.security.repository.SecurityDetailsRepository;

class HoldingSecurityServiceTest {
    private SecurityDetailsRepository securities;
    private DailyPriceRepository prices;
    private HoldingSecurityService service;

    @BeforeEach
    void setUp() {
        securities = mock(SecurityDetailsRepository.class);
        prices = mock(DailyPriceRepository.class);
        service = new HoldingSecurityService(securities, prices);
    }

    @Test
    void resolvesHoldingByIdOrFallsBackToIsin() {
        SecurityDetails byId = mock(SecurityDetails.class);
        SecurityDetails byIsin = mock(SecurityDetails.class);
        when(securities.findById(1L)).thenReturn(Optional.of(byId));
        when(securities.findByIsin("ISIN2")).thenReturn(Optional.of(byIsin));

        assertEquals(byId, service.resolveHolding(PortfolioHolding.builder().securityId(1L).isin("ignored").build()));
        assertEquals(byIsin, service.resolveHolding(PortfolioHolding.builder().isin("ISIN2").build()));
    }

    @Test
    void resolvesTradeByIdOrFallsBackToIsin() {
        SecurityDetails byId = mock(SecurityDetails.class);
        SecurityDetails byIsin = mock(SecurityDetails.class);
        when(securities.findById(3L)).thenReturn(Optional.of(byId));
        when(securities.findByIsin("ISIN4")).thenReturn(Optional.of(byIsin));

        assertEquals(byId, service.resolveTrade(PortfolioTrade.builder().securityId(3L).build()));
        assertEquals(byIsin, service.resolveTrade(PortfolioTrade.builder().isin("ISIN4").build()));
    }

    @Test
    void missingSecurityThrowsDomainException() {
        when(securities.findById(5L)).thenReturn(Optional.empty());
        when(securities.findByIsin("UNKNOWN")).thenReturn(Optional.empty());

        assertThrows(SecurityNotFoundException.class,
                () -> service.resolveHolding(PortfolioHolding.builder().securityId(5L).build()));
        assertThrows(SecurityNotFoundException.class,
                () -> service.resolveTrade(PortfolioTrade.builder().isin("UNKNOWN").build()));
    }

    @Test
    void comparesSecurityIdsAndLegacyIsinOrSymbol() {
        SecurityDetails security = mock(SecurityDetails.class);
        when(security.getSecurityId()).thenReturn(9L);
        when(security.getIsin()).thenReturn("ISIN9");
        when(security.getSymbol()).thenReturn("ABC");

        assertTrue(service.sameSecurity(PortfolioHolding.builder().securityId(9L).build(), security));
        assertTrue(service.sameSecurity(PortfolioHolding.builder().isin("ISIN9").build(), security));
        assertTrue(service.sameSecurity(PortfolioHolding.builder().symbol("ABC").build(), security));
        assertFalse(service.sameSecurity(PortfolioHolding.builder().isin("OTHER").symbol("OTHER").build(), security));
    }

    @Test
    void mapsAllSupportedAssetTypes() {
        assertEquals(AssetClass.STOCKS, service.assetClass(AssetType.EQUITY));
        assertEquals(AssetClass.MUTUAL_FUNDS, service.assetClass(AssetType.MUTUAL));
        assertEquals(AssetClass.COMMODITIES, service.assetClass(AssetType.COMMODITY));
        assertEquals(AssetClass.BONDS, service.assetClass(AssetType.BOND));
        assertEquals(AssetClass.CRYPTO, service.assetClass(AssetType.CRYPTO));
        assertEquals(AssetClass.REITS, service.assetClass(AssetType.REIT));
        assertEquals(AssetClass.ETFS, service.assetClass(AssetType.ETF));
        assertEquals(AssetClass.CASH, service.assetClass(AssetType.CASH));
    }

    @Test
    void readsLatestAndHistoricalPrices() {
        LocalDate date = LocalDate.of(2025, 4, 1);
        DailyPrice latest = mock(DailyPrice.class);
        DailyPrice historical = mock(DailyPrice.class);
        when(prices.findTopBySecurityIdOrderByTradeDateDesc(2L)).thenReturn(Optional.of(latest));
        when(prices.findTopBySecurityIdAndTradeDateLessThanEqualOrderByTradeDateDesc(2L, date))
                .thenReturn(Optional.of(historical));

        assertEquals(latest, service.latestPrice(2L));
        assertEquals(historical, service.priceOnOrBefore(2L, date));
        verify(prices).findTopBySecurityIdOrderByTradeDateDesc(2L);
    }

    @Test
    void priceValueUsesFirstPositiveCandidateAndRejectsMissingPrices() {
        DailyPrice fallback = mock(DailyPrice.class);
        when(fallback.getValuationPrice()).thenReturn(BigDecimal.ZERO);
        when(fallback.getClosePrice()).thenReturn(null);
        when(fallback.getNav()).thenReturn(new BigDecimal("12.75"));
        assertEquals(new BigDecimal("12.75"), service.priceValue(fallback));

        DailyPrice invalid = mock(DailyPrice.class);
        assertThrows(PortfolioValidationException.class, () -> service.priceValue(invalid));
        assertThrows(PortfolioValidationException.class, () -> service.priceValue(null));
    }
}