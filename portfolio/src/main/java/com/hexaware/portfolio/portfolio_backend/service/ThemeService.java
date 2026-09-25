package com.hexaware.portfolio.portfolio_backend.service;

import java.time.Instant;
import java.util.List;

import org.springframework.stereotype.Service;

import com.hexaware.portfolio.portfolio_backend.dto.ThemeDefinitionResponse;
import com.hexaware.portfolio.portfolio_backend.entity.Portfolio;
import com.hexaware.portfolio.portfolio_backend.entity.enums.InvestmentThemes;
import com.hexaware.portfolio.portfolio_backend.exceptions.PortfolioNotFoundException;
import com.hexaware.portfolio.portfolio_backend.exceptions.PortfolioValidationException;
import com.hexaware.portfolio.portfolio_backend.exceptions.ThemeNotAttachedException;
import com.hexaware.portfolio.portfolio_backend.repository.PortfolioRepository;
import com.hexaware.portfolio.portfolio_backend.repository.ThemeRepository;

@Service
public class ThemeService {

    private final PortfolioRepository portfolioRepository;
    private final ThemeRepository themeRepository;

    public ThemeService(PortfolioRepository portfolioRepository, ThemeRepository themeRepository) {
        this.portfolioRepository = portfolioRepository;
        this.themeRepository = themeRepository;
    }

    public List<ThemeDefinitionResponse> getAllThemes() {
        return themeRepository.findAll();
    }

    public Portfolio attachTheme(String portfolioId, InvestmentThemes theme) {
        if (theme == null) {
            throw new PortfolioValidationException("Investment theme is required");
        }

        Portfolio portfolio = findPortfolio(portfolioId);
        portfolio.setTheme(theme);
        portfolio.setHoldingsSaved(false);
        portfolio.setUpdatedAt(Instant.now());
        return portfolioRepository.save(portfolio);
    }

    public ThemeDefinitionResponse getAttachedTheme(String portfolioId) {
        Portfolio portfolio = findPortfolio(portfolioId);
        if (portfolio.getTheme() == null) {
            throw new ThemeNotAttachedException(portfolioId);
        }
        return themeRepository.findByTheme(portfolio.getTheme());
    }

    public void removeTheme(String portfolioId) {
        Portfolio portfolio = findPortfolio(portfolioId);
        portfolio.setTheme(null);
        portfolio.setHoldingsSaved(false);
        portfolio.setUpdatedAt(Instant.now());
        portfolioRepository.save(portfolio);
    }

    private Portfolio findPortfolio(String portfolioId) {
        if (portfolioId == null || portfolioId.isBlank()) {
            throw new PortfolioValidationException("Portfolio id is required");
        }
        return portfolioRepository.findById(portfolioId)
                .orElseThrow(() -> new PortfolioNotFoundException(portfolioId));
    }
}
