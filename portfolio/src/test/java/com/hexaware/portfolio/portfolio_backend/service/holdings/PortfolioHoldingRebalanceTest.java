package com.hexaware.portfolio.portfolio_backend.service.holdings;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.hexaware.portfolio.portfolio_backend.dto.RebalanceRequest;
import com.hexaware.portfolio.portfolio_backend.dto.AddSecurityRequest;
import com.hexaware.portfolio.portfolio_backend.entity.Portfolio;
import com.hexaware.portfolio.portfolio_backend.entity.PortfolioHolding;
import com.hexaware.portfolio.portfolio_backend.entity.PortfolioTrade;
import com.hexaware.portfolio.portfolio_backend.entity.enums.AssetClass;
import com.hexaware.portfolio.portfolio_backend.exceptions.PortfolioValidationException;
import com.hexaware.portfolio.portfolio_backend.repository.PortfolioHoldingRepository;
import com.hexaware.portfolio.portfolio_backend.repository.PortfolioRepository;
import com.hexaware.portfolio.portfolio_backend.repository.PortfolioTradeRepository;
import com.hexaware.portfolio.portfolio_backend.repository.ThemeRepository;
import com.hexaware.portfolio.portfolio_backend.security.AppUser;
import com.hexaware.portfolio.portfolio_backend.security.CurrentUserService;
import com.hexaware.portfolio.security.entity.DailyPrice;
import com.hexaware.portfolio.security.entity.AssetType;
import com.hexaware.portfolio.security.entity.SecurityDetails;
import com.hexaware.portfolio.security.repository.DailyPriceRepository;
import com.hexaware.portfolio.security.repository.SecurityDetailsRepository;

class PortfolioHoldingRebalanceTest {
    private PortfolioRepository portfolios;
    private PortfolioHoldingRepository holdings;
    private PortfolioTradeRepository trades;
    private SecurityDetailsRepository securities;
    private DailyPriceRepository prices;
    private CurrentUserService currentUser;
    private HoldingSecurityService securityService;
    private HoldingAllocationService allocationService;
    private PortfolioHoldingService service;
    private Portfolio portfolio;
    private final LocalDate tradeDate = LocalDate.now().minusDays(1);

    @BeforeEach
    void setUp() {
        portfolios = mock(PortfolioRepository.class);
        holdings = mock(PortfolioHoldingRepository.class);
        trades = mock(PortfolioTradeRepository.class);
        securities = mock(SecurityDetailsRepository.class);
        prices = mock(DailyPriceRepository.class);
        ThemeRepository themes = mock(ThemeRepository.class);
        currentUser = mock(CurrentUserService.class);
        securityService = mock(HoldingSecurityService.class);
        allocationService = mock(HoldingAllocationService.class);
        service = new PortfolioHoldingService(portfolios, holdings, trades, securities, prices, themes,
                currentUser, securityService, allocationService);

        AppUser user = AppUser.builder().id(2L).username("investor").build();
        portfolio = Portfolio.builder().id(12L).owner(user).purchaseDate(tradeDate.minusDays(20))
                .holdingsSaved(true).amount(new BigDecimal("1000")).build();
        when(currentUser.getCurrentUser()).thenReturn(user);
        when(portfolios.findByIdAndOwnerUsername(12L, "investor")).thenReturn(Optional.of(portfolio));
        when(trades.existsByPortfolioId(12L)).thenReturn(true);
    }

    @Test
    void rebalanceRejectsMissingOrInvalidTradeRequest() {
        assertThrows(PortfolioValidationException.class, () -> service.rebalance(12L, null));
        assertThrows(PortfolioValidationException.class,
                () -> service.rebalance(12L, new RebalanceRequest(null, List.of())));
        assertThrows(PortfolioValidationException.class,
                () -> service.rebalance(12L, new RebalanceRequest(tradeDate, List.of())));
        verify(trades, never()).save(any(PortfolioTrade.class));
    }

    @Test
    void rebalanceRejectsTradeDatesOutsidePortfolioLifetime() {
        assertThrows(PortfolioValidationException.class,
                () -> service.rebalance(12L, request(tradeDate.minusDays(30), 1L, "-1")));
        assertThrows(PortfolioValidationException.class,
                () -> service.rebalance(12L, request(LocalDate.now().plusDays(1), 1L, "-1")));
    }

    @Test
    void rebalanceRecordsBuyOrdersAndRefreshesHoldingSnapshot() {
        SecurityDetails security = mock(SecurityDetails.class);
        DailyPrice price = mock(DailyPrice.class);
        price.setTradeDate(tradeDate);
        List<PortfolioTrade> allTrades = new ArrayList<>();
        when(trades.findByPortfolioIdAndTradeDateLessThanEqualOrderByTradeDateAscIdAsc(12L, tradeDate))
                .thenReturn(List.of());
        when(securities.findById(1L)).thenReturn(Optional.of(security));
        when(security.getAssetType()).thenReturn(AssetType.EQUITY);
        when(security.getSecurityId()).thenReturn(1L);
        when(security.getIsin()).thenReturn("ISIN1");
        when(security.getSymbol()).thenReturn("ABC");
        when(security.getName()).thenReturn("ABC Corp");
        when(securityService.assetClass(AssetType.EQUITY)).thenReturn(AssetClass.STOCKS);
        when(securityService.priceOnOrBefore(1L, tradeDate)).thenReturn(price);
        when(securityService.priceValue(price)).thenReturn(new BigDecimal("10"));
        when(securityService.tradeSecurityId(any(PortfolioTrade.class))).thenReturn(1L);
        when(securityService.resolveTrade(any(PortfolioTrade.class))).thenReturn(security);
        when(securityService.latestPrice(1L)).thenReturn(price);
        when(price.getTradeDate()).thenReturn(tradeDate);
        when(trades.save(any(PortfolioTrade.class))).thenAnswer(invocation -> {
            PortfolioTrade saved = invocation.getArgument(0);
            saved.setId(1L);
            allTrades.add(saved);
            return saved;
        });
        when(trades.findAllByPortfolioId(12L)).thenReturn(allTrades);
        when(holdings.findByPortfolioId(12L)).thenReturn(List.of());
        when(holdings.save(any(PortfolioHolding.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.rebalance(12L, request(tradeDate, 1L, "1"));

        assertEquals(1, allTrades.size());
        assertEquals(new BigDecimal("1"), allTrades.get(0).getSignedShares());
        verify(holdings).save(any(PortfolioHolding.class));
    }

    @Test
    void rebalanceRejectsSellingMoreThanOwned() {
        PortfolioTrade prior = PortfolioTrade.builder().id(1L).securityId(1L)
                .signedShares(new BigDecimal("2")).tradeDate(tradeDate.minusDays(1)).build();
        SecurityDetails security = mock(SecurityDetails.class);
        when(trades.findByPortfolioIdAndTradeDateLessThanEqualOrderByTradeDateAscIdAsc(12L, tradeDate))
                .thenReturn(List.of(prior));
        when(securityService.tradeSecurityId(prior)).thenReturn(1L);
        when(securityService.resolveTrade(prior)).thenReturn(security);
        when(security.getAssetType()).thenReturn(AssetType.EQUITY);
        when(securityService.assetClass(AssetType.EQUITY)).thenReturn(AssetClass.STOCKS);
        DailyPrice price = mock(DailyPrice.class);
        when(securityService.priceOnOrBefore(1L, tradeDate)).thenReturn(price);
        when(securityService.priceValue(price)).thenReturn(BigDecimal.TEN);
        when(securities.findById(1L)).thenReturn(Optional.of(security));

        assertThrows(PortfolioValidationException.class,
                () -> service.rebalance(12L, request(tradeDate, 1L, "-3")));

        verify(trades, never()).save(any(PortfolioTrade.class));
    }

    @Test
    void rebalanceRecordsSaleAndRefreshesHoldingSnapshot() {
        PortfolioTrade prior = PortfolioTrade.builder().id(1L).portfolioId(12L).securityId(1L)
                .symbol("ABC").securityName("ABC Corp").assetClass(AssetClass.STOCKS)
                .signedShares(new BigDecimal("5")).tradeDate(tradeDate.minusDays(1)).build();
        SecurityDetails security = mock(SecurityDetails.class);
        DailyPrice price = mock(DailyPrice.class);
        price.setTradeDate(tradeDate);
        PortfolioHolding holding = PortfolioHolding.builder().id(3L).portfolioId(12L).securityId(1L)
                .shares(new BigDecimal("5")).price(new BigDecimal("10")).value(new BigDecimal("50.00"))
                .assetClass(AssetClass.STOCKS).build();
        List<PortfolioTrade> allTrades = new ArrayList<>(List.of(prior));
        when(trades.findByPortfolioIdAndTradeDateLessThanEqualOrderByTradeDateAscIdAsc(12L, tradeDate))
                .thenReturn(List.of(prior));
        when(securityService.tradeSecurityId(prior)).thenReturn(1L);
        when(securities.findById(1L)).thenReturn(Optional.of(security));
        when(securityService.assetClass(security.getAssetType())).thenReturn(AssetClass.STOCKS);
        when(securityService.priceOnOrBefore(1L, tradeDate)).thenReturn(price);
        when(securityService.priceValue(price)).thenReturn(new BigDecimal("10"));
        when(trades.save(any(PortfolioTrade.class))).thenAnswer(invocation -> {
            PortfolioTrade saved = invocation.getArgument(0);
            saved.setId(2L);
            allTrades.add(saved);
            return saved;
        });
        when(trades.findAllByPortfolioId(12L)).thenReturn(allTrades);
        when(securityService.tradeSecurityId(any(PortfolioTrade.class))).thenReturn(1L);
        when(holdings.findByPortfolioId(12L)).thenReturn(List.of(holding));
        when(securityService.resolveHolding(holding)).thenReturn(security);
        when(securityService.resolveTrade(any(PortfolioTrade.class))).thenReturn(security);
        when(security.getSecurityId()).thenReturn(1L);
        when(security.getIsin()).thenReturn("ISIN1");
        when(securityService.latestPrice(1L)).thenReturn(price);
        when(price.getTradeDate()).thenReturn(tradeDate);
        when(holdings.save(holding)).thenReturn(holding);

        service.rebalance(12L, request(tradeDate, 1L, "-2"));

        assertEquals(new BigDecimal("3"), holding.getShares());
        assertEquals(new BigDecimal("30.00"), holding.getValue());
        verify(trades).save(any(PortfolioTrade.class));
        verify(holdings).save(holding);
    }

        @Test
        void addSecurityCreatesHoldingUsingPurchaseDatePrice() {
                portfolio.setHoldingsSaved(false);
                SecurityDetails security = mock(SecurityDetails.class);
                DailyPrice price = mock(DailyPrice.class);
                price.setTradeDate(tradeDate);
                when(securities.findById(1L)).thenReturn(Optional.of(security));
                when(security.getAssetType()).thenReturn(AssetType.EQUITY);
                when(security.getSecurityId()).thenReturn(1L);
                when(security.getIsin()).thenReturn("ISIN1");
                when(security.getSymbol()).thenReturn("ABC");
                when(security.getName()).thenReturn("ABC Corp");
                when(allocationService.allowedAssetClasses(portfolio)).thenReturn(java.util.Set.of());
                when(holdings.findByPortfolioId(12L)).thenReturn(List.of());
                when(securityService.priceOnOrBefore(1L, portfolio.getPurchaseDate())).thenReturn(price);
                when(securityService.assetClass(AssetType.EQUITY)).thenReturn(AssetClass.STOCKS);
                when(securityService.priceValue(price)).thenReturn(new BigDecimal("10"));
                when(price.getTradeDate()).thenReturn(portfolio.getPurchaseDate());
                when(holdings.save(any(PortfolioHolding.class))).thenAnswer(invocation -> invocation.getArgument(0));

                PortfolioHolding result = service.addSecurity(12L,
                                new AddSecurityRequest(1L, null, new BigDecimal("2")));

                assertEquals(1L, result.getSecurityId());
                assertEquals(AssetClass.STOCKS, result.getAssetClass());
                assertEquals(new BigDecimal("2"), result.getShares());
                assertEquals(new BigDecimal("20.00"), result.getValue());
                assertEquals(portfolio.getPurchaseDate(), result.getPriceDate());
        }

        @Test
        void addSecurityRejectsMissingSecurityOrNonpositiveShares() {
                assertThrows(PortfolioValidationException.class, () -> service.addSecurity(12L, null));
                assertThrows(PortfolioValidationException.class,
                                () -> service.addSecurity(12L, new AddSecurityRequest(null, null, BigDecimal.ONE)));
                assertThrows(PortfolioValidationException.class,
                                () -> service.addSecurity(12L, new AddSecurityRequest(1L, null, BigDecimal.ZERO)));
                verify(securities, never()).findById(1L);
        }

        @Test
        void saveHoldingsRequiresAtLeastOneHolding() {
                when(holdings.findByPortfolioId(12L)).thenReturn(List.of());

                assertThrows(PortfolioValidationException.class, () -> service.saveHoldings(12L));
                verify(trades, never()).save(any(PortfolioTrade.class));
        }

        @Test
        void updateRejectsNonpositiveShareQuantity() {
                PortfolioHolding holding = PortfolioHolding.builder().id(3L).portfolioId(12L).shares(BigDecimal.ONE).build();
                when(holdings.findByIdAndPortfolioId(3L, 12L)).thenReturn(Optional.of(holding));

                assertThrows(PortfolioValidationException.class,
                                () -> service.update(12L, 3L, new com.hexaware.portfolio.portfolio_backend.dto.UpdateHoldingRequest(BigDecimal.ZERO)));
        }

    private RebalanceRequest request(LocalDate date, Long securityId, String shares) {
        return new RebalanceRequest(date, List.of(new RebalanceRequest.TradeOrder(
                securityId, null, new BigDecimal(shares))));
    }
}
