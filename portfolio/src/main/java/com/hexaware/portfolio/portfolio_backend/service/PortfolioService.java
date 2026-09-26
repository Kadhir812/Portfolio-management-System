package com.hexaware.portfolio.portfolio_backend.service;

import java.time.Instant;
import java.util.List;

import org.springframework.stereotype.Service;

import com.hexaware.portfolio.portfolio_backend.dto.CreatePortfolioRequest;
import com.hexaware.portfolio.portfolio_backend.entity.Portfolio;
import com.hexaware.portfolio.portfolio_backend.exceptions.PortfolioNotFoundException;
import com.hexaware.portfolio.portfolio_backend.exceptions.PortfolioValidationException;
import com.hexaware.portfolio.portfolio_backend.repository.PortfolioRepository;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class PortfolioService {

    private final PortfolioRepository portfolioRepository;

    public Portfolio create(CreatePortfolioRequest request) {
        validate(request);

        Instant now = Instant.now();
        Portfolio portfolio = Portfolio.builder()
                .name(request.name().trim())
                .type(request.type())
                .currency(request.currency())
                .benchmerk(request.benchmark())
                .exchange(request.exchange())
                .rebalanceFrequency(request.rebalanceFrequency())
                .amount(request.amount())
                .theme(null)
                .createdAt(now)
                .updatedAt(now)
                .build();

        return portfolioRepository.save(portfolio);
    }

    public List<Portfolio> getAll() {
        return portfolioRepository.findAll();
    }

    public Portfolio getById(String portfolioId) {
        return findPortfolio(portfolioId);
    }

    public Portfolio update(String portfolioId, CreatePortfolioRequest request) {
        validate(request);

        Portfolio portfolio = findPortfolio(portfolioId);
        portfolio.setName(request.name().trim());
        portfolio.setType(request.type());
        portfolio.setCurrency(request.currency());
        portfolio.setBenchmerk(request.benchmark());
        portfolio.setExchange(request.exchange());
        portfolio.setRebalanceFrequency(request.rebalanceFrequency());
        portfolio.setAmount(request.amount());
        portfolio.setHoldingsSaved(false);
        portfolio.setUpdatedAt(Instant.now());
        return portfolioRepository.save(portfolio);
    }

    public void delete(String portfolioId) {
        portfolioRepository.delete(findPortfolio(portfolioId));
    }

    private Portfolio findPortfolio(String portfolioId) {
        if (portfolioId == null || portfolioId.isBlank()) {
            throw new PortfolioValidationException("Portfolio id is required");
        }
        return portfolioRepository.findById(portfolioId)
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
        if (request.amount() == null || request.amount() < 0) {
            throw new PortfolioValidationException("Amount must be zero or greater");
        }
    }
}
