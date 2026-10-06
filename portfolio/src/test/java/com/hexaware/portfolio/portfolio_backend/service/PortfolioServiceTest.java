package com.hexaware.portfolio.portfolio_backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.hexaware.portfolio.portfolio_backend.dto.CreatePortfolioRequest;
import com.hexaware.portfolio.portfolio_backend.entity.Portfolio;
import com.hexaware.portfolio.portfolio_backend.entity.enums.BenchMark;
import com.hexaware.portfolio.portfolio_backend.entity.enums.Currency;
import com.hexaware.portfolio.portfolio_backend.entity.enums.Exchange;
import com.hexaware.portfolio.portfolio_backend.entity.enums.PortfolioType;
import com.hexaware.portfolio.portfolio_backend.entity.enums.PortfolioStatus;
import com.hexaware.portfolio.portfolio_backend.entity.enums.RebalanceFrequency;
import com.hexaware.portfolio.portfolio_backend.exceptions.PortfolioNotFoundException;
import com.hexaware.portfolio.portfolio_backend.exceptions.PortfolioValidationException;
import com.hexaware.portfolio.portfolio_backend.repository.PortfolioRepository;
import com.hexaware.portfolio.portfolio_backend.repository.PortfolioHoldingRepository;
import com.hexaware.portfolio.portfolio_backend.repository.PortfolioTradeRepository;
import com.hexaware.portfolio.portfolio_backend.security.AppUser;
import com.hexaware.portfolio.portfolio_backend.security.CurrentUserService;

class PortfolioServiceTest {
    private PortfolioRepository portfolioRepository;
    private PortfolioHoldingRepository holdings;
    private PortfolioTradeRepository trades;
    private CurrentUserService currentUserService;
    private PortfolioService portfolioService;
    private AppUser owner;

    @BeforeEach
    void setUp() {
        portfolioRepository = mock(PortfolioRepository.class);
        holdings = mock(PortfolioHoldingRepository.class);
        trades = mock(PortfolioTradeRepository.class);
        currentUserService = mock(CurrentUserService.class);
        portfolioService = new PortfolioService(portfolioRepository, holdings, trades, currentUserService);
        owner = AppUser.builder().id(7L).username("investor").build();
    }

    @Test
    void createTrimsNameUsesPurchaseDateAndSavesForCurrentUser() {
        CreatePortfolioRequest request = request("  Retirement  ", new BigDecimal("25000.00"), LocalDate.now());
        when(currentUserService.getCurrentUser()).thenReturn(owner);
        when(portfolioRepository.save(org.mockito.ArgumentMatchers.any(Portfolio.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        Portfolio result = portfolioService.create(request);

        assertEquals("Retirement", result.getName());
        assertEquals(owner, result.getOwner());
        assertEquals(request.amount(), result.getAmount());
        assertEquals(request.purchaseDate(), result.getPurchaseDate());
        assertEquals(PortfolioStatus.NEW, result.getStatus());
        assertNotNull(result.getCreatedAt());
        verify(portfolioRepository).save(result);
    }

    @Test
    void createDefaultsPurchaseDateToToday() {
        when(currentUserService.getCurrentUser()).thenReturn(owner);
        when(portfolioRepository.save(org.mockito.ArgumentMatchers.any(Portfolio.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        Portfolio result = portfolioService.create(request("Savings", BigDecimal.ZERO, null));

        assertEquals(LocalDate.now(), result.getPurchaseDate());
    }

    @Test
    void createRejectsInvalidRequestsBeforeAccessingDependencies() {
        assertThrows(PortfolioValidationException.class, () -> portfolioService.create(null));
        assertThrows(PortfolioValidationException.class,
                () -> portfolioService.create(request("  ", BigDecimal.ONE, LocalDate.now())));
        assertThrows(PortfolioValidationException.class,
                () -> portfolioService.create(new CreatePortfolioRequest("Name", null, Currency.INR,
                        BenchMark.NIFTY50, Exchange.NSE, RebalanceFrequency.MONTHLY, BigDecimal.ONE, LocalDate.now())));
        assertThrows(PortfolioValidationException.class,
                () -> portfolioService.create(request("Name", null, LocalDate.now())));
        assertThrows(PortfolioValidationException.class,
                () -> portfolioService.create(request("Name", BigDecimal.valueOf(-1), LocalDate.now())));
        assertThrows(PortfolioValidationException.class,
                () -> portfolioService.create(request("Name", BigDecimal.ONE, LocalDate.now().plusDays(1))));

        verify(currentUserService, never()).getCurrentUser();
        verify(portfolioRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void getAllUsesAuthenticatedOwnersUsername() {
        when(currentUserService.getCurrentUser()).thenReturn(owner);
        when(portfolioRepository.findAllByOwnerUsername("investor")).thenReturn(List.of(Portfolio.builder().id(1L).build()));

        List<Portfolio> result = portfolioService.getAll();

        assertEquals(1, result.size());
        verify(portfolioRepository).findAllByOwnerUsername("investor");
    }

    @Test
    void getByIdReturnsOnlyPortfolioOwnedByCurrentUser() {
        Portfolio expected = Portfolio.builder().id(3L).owner(owner).build();
        when(currentUserService.getCurrentUser()).thenReturn(owner);
        when(portfolioRepository.findByIdAndOwnerUsername(3L, "investor")).thenReturn(Optional.of(expected));

        assertEquals(expected, portfolioService.getById(3L));
    }

    @Test
    void getByIdRejectsNullIdAndMissingPortfolio() {
        assertThrows(PortfolioValidationException.class, () -> portfolioService.getById(null));
        when(currentUserService.getCurrentUser()).thenReturn(owner);
        when(portfolioRepository.findByIdAndOwnerUsername(99L, "investor")).thenReturn(Optional.empty());

        assertThrows(PortfolioNotFoundException.class, () -> portfolioService.getById(99L));
    }

    @Test
    void updateChangesSettingsAndPurchaseDateBeforeHoldingsAreSaved() {
        Portfolio portfolio = Portfolio.builder().id(5L).owner(owner).holdingsSaved(false).build();
        when(currentUserService.getCurrentUser()).thenReturn(owner);
        when(portfolioRepository.findByIdAndOwnerUsername(5L, "investor")).thenReturn(Optional.of(portfolio));
        when(portfolioRepository.save(portfolio)).thenReturn(portfolio);
        LocalDate updatedDate = LocalDate.now().minusDays(5);

        Portfolio result = portfolioService.update(5L, request(" Updated ", BigDecimal.TEN, updatedDate));

        assertEquals("Updated", result.getName());
        assertEquals(BigDecimal.TEN, result.getAmount());
        assertEquals(updatedDate, result.getPurchaseDate());
        verify(portfolioRepository).save(portfolio);
    }

    @Test
    void updateKeepsPurchaseDateAfterHoldingsAreSaved() {
        LocalDate originalDate = LocalDate.now().minusMonths(1);
        Portfolio portfolio = Portfolio.builder().id(5L).owner(owner).holdingsSaved(true)
                .purchaseDate(originalDate).build();
        when(currentUserService.getCurrentUser()).thenReturn(owner);
        when(portfolioRepository.findByIdAndOwnerUsername(5L, "investor")).thenReturn(Optional.of(portfolio));
        when(portfolioRepository.save(portfolio)).thenReturn(portfolio);

        Portfolio result = portfolioService.update(5L,
                request("Updated", BigDecimal.TEN, LocalDate.now().minusDays(2)));

        assertEquals(originalDate, result.getPurchaseDate());
        assertEquals("Updated", result.getName());
    }

    @Test
    void closeSupportsNewAndActivePortfolios() {
        Portfolio newPortfolio = Portfolio.builder().id(8L).owner(owner).status(PortfolioStatus.NEW).build();
        Portfolio activePortfolio = Portfolio.builder().id(9L).owner(owner).holdingsSaved(true)
                .status(PortfolioStatus.ACTIVE).build();
        when(currentUserService.getCurrentUser()).thenReturn(owner);
        when(portfolioRepository.findByIdAndOwnerUsername(8L, "investor")).thenReturn(Optional.of(newPortfolio));
        when(portfolioRepository.findByIdAndOwnerUsername(9L, "investor")).thenReturn(Optional.of(activePortfolio));
        when(portfolioRepository.save(newPortfolio)).thenReturn(newPortfolio);
        when(portfolioRepository.save(activePortfolio)).thenReturn(activePortfolio);

        assertEquals(PortfolioStatus.CLOSED, portfolioService.close(8L).getStatus());
        assertEquals(PortfolioStatus.CLOSED, portfolioService.close(9L).getStatus());
    }

    @Test
    void deleteRequiresClosedPortfolio() {
        Portfolio portfolio = Portfolio.builder().id(8L).owner(owner).status(PortfolioStatus.ACTIVE).build();
        when(currentUserService.getCurrentUser()).thenReturn(owner);
        when(portfolioRepository.findByIdAndOwnerUsername(8L, "investor")).thenReturn(Optional.of(portfolio));

        assertThrows(PortfolioValidationException.class, () -> portfolioService.delete(8L));

        verify(holdings, never()).deleteByPortfolioId(8L);
        verify(trades, never()).deleteByPortfolioId(8L);
        verify(portfolioRepository, never()).delete(portfolio);
    }

    @Test
    void deleteClosedPortfolioRemovesChildrenBeforePortfolio() {
        Portfolio portfolio = Portfolio.builder().id(8L).owner(owner).status(PortfolioStatus.CLOSED).build();
        when(currentUserService.getCurrentUser()).thenReturn(owner);
        when(portfolioRepository.findByIdAndOwnerUsername(8L, "investor")).thenReturn(Optional.of(portfolio));

        portfolioService.delete(8L);

        var deletionOrder = inOrder(holdings, trades, portfolioRepository);
        deletionOrder.verify(holdings).deleteByPortfolioId(8L);
        deletionOrder.verify(trades).deleteByPortfolioId(8L);
        deletionOrder.verify(portfolioRepository).delete(portfolio);
    }

    private CreatePortfolioRequest request(String name, BigDecimal amount, LocalDate purchaseDate) {
        return new CreatePortfolioRequest(name, PortfolioType.AMOUNT, Currency.INR, BenchMark.NIFTY50,
                Exchange.NSE, RebalanceFrequency.MONTHLY, amount, purchaseDate);
    }
}