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
import com.hexaware.portfolio.portfolio_backend.security.CurrentUserService;

@Service
public class ThemeService {

    private final PortfolioRepository portfolioRepository;
    private final ThemeRepository themeRepository;
    private final CurrentUserService currentUserService;

    public ThemeService(
            PortfolioRepository portfolioRepository,
            ThemeRepository themeRepository,
            CurrentUserService currentUserService) {
        this.portfolioRepository = portfolioRepository;
        this.themeRepository = themeRepository;
        this.currentUserService = currentUserService;
    }

    public List<ThemeDefinitionResponse> getAllThemes() {
        return themeRepository.findAll();
    }

    public Portfolio attachTheme(Long portfolioId, InvestmentThemes theme) {
        if (theme == null) {
            throw new PortfolioValidationException("Investment theme is required");
        }

        Portfolio portfolio = findPortfolio(portfolioId);
        portfolio.setTheme(theme);
        portfolio.setUpdatedAt(Instant.now());
        return portfolioRepository.save(portfolio);
    }

    public ThemeDefinitionResponse getAttachedTheme(Long portfolioId) {
        Portfolio portfolio = findPortfolio(portfolioId);
        if (portfolio.getTheme() == null) {
            throw new ThemeNotAttachedException(portfolioId);
        }
        return themeRepository.findByTheme(portfolio.getTheme());
    }

    public void removeTheme(Long portfolioId) {
        Portfolio portfolio = findPortfolio(portfolioId);
        portfolio.setTheme(null);
        portfolio.setUpdatedAt(Instant.now());
        portfolioRepository.save(portfolio);
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
}
