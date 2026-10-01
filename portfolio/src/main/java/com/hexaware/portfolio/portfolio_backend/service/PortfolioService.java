package com.hexaware.portfolio.portfolio_backend.service;

import java.time.Instant;
import java.util.List;
import java.time.LocalDate;

import org.springframework.stereotype.Service;

import com.hexaware.portfolio.portfolio_backend.dto.CreatePortfolioRequest;
import com.hexaware.portfolio.portfolio_backend.entity.Portfolio;
import com.hexaware.portfolio.portfolio_backend.exceptions.PortfolioNotFoundException;
import com.hexaware.portfolio.portfolio_backend.exceptions.PortfolioValidationException;
import com.hexaware.portfolio.portfolio_backend.repository.PortfolioRepository;
import com.hexaware.portfolio.portfolio_backend.security.AppUser;
import com.hexaware.portfolio.portfolio_backend.security.CurrentUserService;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class PortfolioService {

    private final PortfolioRepository portfolioRepository;
    private final CurrentUserService currentUserService;

    public Portfolio create(CreatePortfolioRequest request) {
        validate(request);

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

    public void delete(Long portfolioId) {
        portfolioRepository.delete(findPortfolio(portfolioId));
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
