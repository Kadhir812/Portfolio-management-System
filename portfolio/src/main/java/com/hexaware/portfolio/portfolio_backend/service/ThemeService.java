package com.hexaware.portfolio.portfolio_backend.service;

import java.time.Instant;
import java.math.BigDecimal;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hexaware.portfolio.portfolio_backend.dto.EquityCategoryAllocationResponse;
import com.hexaware.portfolio.portfolio_backend.dto.ThemeDefinitionResponse;
import com.hexaware.portfolio.portfolio_backend.dto.ThemeAllocationResponse;
import com.hexaware.portfolio.portfolio_backend.dto.UpdateThemeDefinitionRequest;
import com.hexaware.portfolio.portfolio_backend.entity.Portfolio;
import com.hexaware.portfolio.portfolio_backend.entity.ThemeAllocation;
import com.hexaware.portfolio.portfolio_backend.entity.ThemeDefinition;
import com.hexaware.portfolio.portfolio_backend.entity.ThemeEquityAllocation;
import com.hexaware.portfolio.portfolio_backend.entity.enums.AssetClass;
import com.hexaware.portfolio.portfolio_backend.entity.enums.EquityCategory;
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

    @Transactional(readOnly = true)
    public List<ThemeDefinitionResponse> getAllThemes() {
        return themeRepository.findAllByOrderByIdAsc().stream().map(this::toResponse).toList();
    }

    @Transactional
    public ThemeDefinitionResponse updateDefinition(InvestmentThemes code, UpdateThemeDefinitionRequest request) {
        if (request == null) throw new PortfolioValidationException("Theme definition is required");
        requireText(request.label(), "Theme name");
        requireText(request.risk(), "Risk");
        requireText(request.investmentHorizon(), "Investment horizon");
        if (request.allocations() == null || request.equityAllocations() == null) {
            throw new PortfolioValidationException("Asset-class and equity-category targets are required");
        }

        Map<AssetClass, BigDecimal> classTargets = new EnumMap<>(AssetClass.class);
        BigDecimal classTotal = BigDecimal.ZERO;
        for (UpdateThemeDefinitionRequest.Allocation allocation : request.allocations()) {
            if (allocation == null || allocation.assetClass() == null || !validPercentage(allocation.percentage())
                    || classTargets.putIfAbsent(allocation.assetClass(), allocation.percentage()) != null) {
                throw new PortfolioValidationException("Asset-class targets must be unique and between 0 and 100");
            }
            classTotal = classTotal.add(allocation.percentage());
        }
        if (classTargets.isEmpty() || classTotal.compareTo(BigDecimal.valueOf(100)) != 0) {
            throw new PortfolioValidationException("Asset-class allocations must total 100%");
        }

        Map<EquityCategory, BigDecimal> categoryTargets = new EnumMap<>(EquityCategory.class);
        BigDecimal categoryTotal = BigDecimal.ZERO;
        for (UpdateThemeDefinitionRequest.EquityAllocation allocation : request.equityAllocations()) {
            if (allocation == null || allocation.equityCategory() == null || !validPercentage(allocation.percentage())
                    || categoryTargets.putIfAbsent(allocation.equityCategory(), allocation.percentage()) != null) {
                throw new PortfolioValidationException("Equity-category targets must be unique and between 0 and 100");
            }
            categoryTotal = categoryTotal.add(allocation.percentage());
        }
        if (categoryTargets.size() != EquityCategory.values().length || categoryTotal.compareTo(BigDecimal.valueOf(100)) != 0) {
            throw new PortfolioValidationException("Large, mid, and small cap targets must total 100% within equity");
        }

        ThemeDefinition theme = themeRepository.findByTheme(code)
                .orElseThrow(() -> new PortfolioValidationException("Investment theme is not configured"));
        theme.setLabel(request.label().trim());
        theme.setRisk(request.risk().trim());
        theme.setInvestmentHorizon(request.investmentHorizon().trim());
        theme.setDescription(request.description());
        synchronizeClassTargets(theme, classTargets);
        synchronizeEquityTargets(theme, categoryTargets);
        return toResponse(themeRepository.save(theme));
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

    @Transactional(readOnly = true)
    public ThemeDefinitionResponse getAttachedTheme(Long portfolioId) {
        Portfolio portfolio = findPortfolio(portfolioId);
        if (portfolio.getTheme() == null) {
            throw new ThemeNotAttachedException(portfolioId);
        }
        return themeRepository.findByTheme(portfolio.getTheme())
            .map(this::toResponse)
            .orElseThrow(() -> new PortfolioValidationException("Investment theme is not configured"));
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

    private ThemeDefinitionResponse toResponse(ThemeDefinition theme) {
        return new ThemeDefinitionResponse(
                theme.getTheme(),
                theme.getLabel(),
                theme.getAllocations().stream()
                        .map(allocation -> new ThemeAllocationResponse(allocation.getAssetClass(), allocation.getPercentage()))
                        .toList(),
                theme.getEquityAllocations().stream()
                        .map(allocation -> new EquityCategoryAllocationResponse(allocation.getEquityCategory(), allocation.getPercentage()))
                        .toList(),
                theme.getRisk(),
                theme.getInvestmentHorizon(),
                theme.getDescription());
    }

    private void synchronizeClassTargets(ThemeDefinition theme, Map<AssetClass, BigDecimal> targets) {
        Map<AssetClass, ThemeAllocation> existing = new EnumMap<>(AssetClass.class);
        theme.getAllocations().forEach(allocation -> existing.put(allocation.getAssetClass(), allocation));
        theme.getAllocations().removeIf(allocation -> !targets.containsKey(allocation.getAssetClass()));
        targets.forEach((assetClass, percentage) -> {
            ThemeAllocation allocation = existing.get(assetClass);
            if (allocation == null) {
                allocation = new ThemeAllocation();
                allocation.setAssetClass(assetClass);
                theme.addAllocation(allocation);
            }
            allocation.setPercentage(percentage);
        });
    }

    private void synchronizeEquityTargets(ThemeDefinition theme, Map<EquityCategory, BigDecimal> targets) {
        Map<EquityCategory, ThemeEquityAllocation> existing = new EnumMap<>(EquityCategory.class);
        theme.getEquityAllocations().forEach(allocation -> existing.put(allocation.getEquityCategory(), allocation));
        theme.getEquityAllocations().removeIf(allocation -> !targets.containsKey(allocation.getEquityCategory()));
        targets.forEach((category, percentage) -> {
            ThemeEquityAllocation allocation = existing.get(category);
            if (allocation == null) {
                allocation = new ThemeEquityAllocation();
                allocation.setEquityCategory(category);
                theme.addEquityAllocation(allocation);
            }
            allocation.setPercentage(percentage);
        });
    }

    private void requireText(String value, String label) {
        if (value == null || value.isBlank()) throw new PortfolioValidationException(label + " is required");
    }

    private boolean validPercentage(BigDecimal percentage) {
        return percentage != null && percentage.compareTo(BigDecimal.ZERO) >= 0
                && percentage.compareTo(BigDecimal.valueOf(100)) <= 0;
    }
}
