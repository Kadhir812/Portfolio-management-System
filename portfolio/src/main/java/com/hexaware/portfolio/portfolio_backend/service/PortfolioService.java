package com.hexaware.portfolio.portfolio_backend.service;

import java.time.Instant;
import java.util.List;
import java.time.LocalDate;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hexaware.portfolio.portfolio_backend.dto.CreatePortfolioRequest;
import com.hexaware.portfolio.portfolio_backend.entity.Portfolio;
import com.hexaware.portfolio.portfolio_backend.entity.enums.PortfolioStatus;
import com.hexaware.portfolio.portfolio_backend.exceptions.PortfolioNotFoundException;
import com.hexaware.portfolio.portfolio_backend.exceptions.PortfolioValidationException;
import com.hexaware.portfolio.portfolio_backend.repository.PortfolioRepository;
import com.hexaware.portfolio.portfolio_backend.repository.PortfolioHoldingRepository;
import com.hexaware.portfolio.portfolio_backend.repository.PortfolioTradeRepository;
import com.hexaware.portfolio.portfolio_backend.security.AppUser;
import com.hexaware.portfolio.portfolio_backend.security.CurrentUserService;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class PortfolioService {

    private final PortfolioRepository portfolioRepository;
    private final PortfolioHoldingRepository holdings;
    private final PortfolioTradeRepository trades;
    private final CurrentUserService currentUserService;

    public Portfolio create(CreatePortfolioRequest request) {
        validate(request);
        if (request.status() != null && request.status() != PortfolioStatus.NEW) {
            throw new PortfolioValidationException("A new portfolio must start with New status");
        }

        Instant now = Instant.now();
        AppUser owner = currentUserService.getCurrentUser();
        Portfolio portfolio = Portfolio.builder()
            .owner(owner)
                .name(request.name().trim())
                .type(request.type())
                .currency(request.currency())
                .benchmark(request.benchmark())
                .exchange(request.exchange())
                .rebalanceFrequency(request.rebalanceFrequency())
                .amount(request.amount())
                .purchaseDate(request.purchaseDate() == null ? LocalDate.now() : request.purchaseDate())
                .status(PortfolioStatus.NEW)
                .theme(null)
                .createdAt(now)
                .updatedAt(now)
                .build();

        return portfolioRepository.save(portfolio);
    }

    public List<Portfolio> getAll() {
        return portfolioRepository.findAllByOwnerUsername(currentUserService.getCurrentUser().getUsername());
    }

    public Portfolio getById(Long portfolioId) {
        return findPortfolio(portfolioId);
    }

    public Portfolio update(Long portfolioId, CreatePortfolioRequest request) {
        validate(request);

        Portfolio portfolio = findPortfolio(portfolioId);
        if (portfolio.getStatus() == PortfolioStatus.CLOSED
                && request.status() != PortfolioStatus.ACTIVE) {
            throw new PortfolioValidationException("Closed portfolios are read-only");
        }
        if (request.status() != null && request.status() != portfolio.getStatus()) {
            if (request.status() == PortfolioStatus.ACTIVE && !portfolio.isHoldingsSaved()) {
                throw new PortfolioValidationException("Save holdings before changing the portfolio to active");
            }
            if (request.status() == PortfolioStatus.CLOSED && !portfolio.isHoldingsSaved()) {
                throw new PortfolioValidationException("Add and save holdings before closing the portfolio");
            }
            if (request.status() == PortfolioStatus.NEW && portfolio.isHoldingsSaved()) {
                throw new PortfolioValidationException("A portfolio with saved holdings cannot be changed back to new");
            }
            if (portfolio.getStatus() == PortfolioStatus.CLOSED && request.status() != PortfolioStatus.ACTIVE) {
                throw new PortfolioValidationException("A closed portfolio can only be reopened as active");
            }
            portfolio.setStatus(request.status());
        }
        portfolio.setName(request.name().trim());
        portfolio.setType(request.type());
        portfolio.setCurrency(request.currency());
        portfolio.setBenchmark(request.benchmark());
        portfolio.setExchange(request.exchange());
        portfolio.setRebalanceFrequency(request.rebalanceFrequency());
        portfolio.setAmount(request.amount());
        if (!portfolio.isHoldingsSaved() && request.purchaseDate() != null) {
            portfolio.setPurchaseDate(request.purchaseDate());
        }
        portfolio.setUpdatedAt(Instant.now());
        return portfolioRepository.save(portfolio);
    }

    @Transactional
    public void delete(Long portfolioId) {
        Portfolio portfolio = findPortfolio(portfolioId);
        trades.deleteByPortfolioId(portfolioId);
        holdings.deleteByPortfolioId(portfolioId);
        portfolioRepository.delete(portfolio);
    }

    public Portfolio close(Long portfolioId) {
        Portfolio portfolio = findPortfolio(portfolioId);
        if (portfolio.getStatus() == PortfolioStatus.NEW) {
            throw new PortfolioValidationException("Add and save holdings before closing the portfolio");
        }
        if (portfolio.getStatus() == PortfolioStatus.CLOSED) {
            throw new PortfolioValidationException("Portfolio is already closed");
        }
        portfolio.setStatus(PortfolioStatus.CLOSED);
        portfolio.setUpdatedAt(Instant.now());
        return portfolioRepository.save(portfolio);
    }

    private Portfolio findPortfolio(Long portfolioId) {
        if (portfolioId == null) {
            throw new PortfolioValidationException("Portfolio id is required");
        }
        return portfolioRepository.findByIdAndOwnerUsername(
                portfolioId,
                currentUserService.getCurrentUser().getUsername())
                .orElseThrow(() -> new PortfolioNotFoundException(portfolioId));
    }

    private void validate(CreatePortfolioRequest request) {
        if (request == null) {
            throw new PortfolioValidationException("Portfolio request is required");
        }
        if (request.name() == null || request.name().isBlank()) {
            throw new PortfolioValidationException("Portfolio name is required");
        }
        if (request.type() == null || request.currency() == null || request.benchmark() == null
                || request.exchange() == null || request.rebalanceFrequency() == null) {
            throw new PortfolioValidationException("All Stage 1 portfolio fields are required");
        }
        if (request.amount() == null || request.amount().signum() < 0) {
            throw new PortfolioValidationException("Amount must be zero or greater");
        }
        if (request.purchaseDate() != null && request.purchaseDate().isAfter(LocalDate.now())) {
            throw new PortfolioValidationException("Purchase date cannot be in the future");
        }
    }
}
