package com.hexaware.portfolio.portfolio_backend.service;

import java.time.Instant;
import java.math.BigDecimal;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hexaware.portfolio.portfolio_backend.dto.ThemeDefinitionResponse;
import com.hexaware.portfolio.portfolio_backend.dto.ThemeAllocationResponse;
import com.hexaware.portfolio.portfolio_backend.dto.ThemeEquityAllocationResponse;
import com.hexaware.portfolio.portfolio_backend.dto.UpdateThemeEquityAllocationsRequest;
import com.hexaware.portfolio.portfolio_backend.dto.UpdateThemeDefinitionRequest;
import com.hexaware.portfolio.portfolio_backend.dto.UpdateThemeConfigurationRequest;
import com.hexaware.portfolio.portfolio_backend.entity.Portfolio;
import com.hexaware.portfolio.portfolio_backend.entity.ThemeDefinition;
import com.hexaware.portfolio.portfolio_backend.entity.ThemeAllocation;
import com.hexaware.portfolio.portfolio_backend.entity.ThemeEquityAllocation;
import com.hexaware.portfolio.portfolio_backend.entity.enums.AssetClass;
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
        return themeRepository.findAllByOrderByIdAsc().stream().map(this::toResponse).toList();
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

    public ThemeDefinitionResponse updateEquityAllocations(
            InvestmentThemes themeCode, UpdateThemeEquityAllocationsRequest request) {
        if (themeCode == null || request == null || request.allocations() == null
                || request.allocations().size() != 3) {
            throw new PortfolioValidationException(
                    "Exactly three equity category allocations are required");
        }

        ThemeDefinition theme = themeRepository.findByTheme(themeCode)
                .orElseThrow(() -> new PortfolioValidationException("Investment theme is not configured"));
        BigDecimal equityTarget = theme.getAllocations().stream()
                .filter(allocation -> allocation.getAssetClass() == AssetClass.EQUITY)
                .map(ThemeAllocation::getPercentage)
                .findFirst()
                .orElseThrow(() -> new PortfolioValidationException("Equity target is not configured"));

        BigDecimal total = BigDecimal.ZERO;
        for (UpdateThemeEquityAllocationsRequest.Allocation allocation : request.allocations()) {
            if (allocation == null || allocation.equityCategory() == null
                    || allocation.percentage() == null || allocation.percentage().signum() < 0
                    || allocation.percentage().compareTo(BigDecimal.valueOf(100)) > 0) {
                throw new PortfolioValidationException("Equity category percentages must be between 0 and 100");
            }
            total = total.add(allocation.percentage());
        }
        if (request.allocations().stream()
                .map(UpdateThemeEquityAllocationsRequest.Allocation::equityCategory)
                .distinct().count() != 3) {
            throw new PortfolioValidationException("Each equity category must be provided once");
        }
        if (total.compareTo(equityTarget) != 0) {
            throw new PortfolioValidationException(
                    "Equity category percentages must total the Equity target of " + equityTarget + "%");
        }

        theme.getEquityAllocations().clear();
        for (UpdateThemeEquityAllocationsRequest.Allocation allocation : request.allocations()) {
            theme.addEquityAllocation(ThemeEquityAllocation.builder()
                    .equityCategory(allocation.equityCategory())
                    .percentage(allocation.percentage())
                    .build());
        }
        return toResponse(themeRepository.save(theme));
    }

    public ThemeDefinitionResponse updateTheme(
            InvestmentThemes themeCode, UpdateThemeDefinitionRequest request) {
        if (themeCode == null || request == null || request.label() == null || request.label().isBlank()
                || request.risk() == null || request.risk().isBlank()
                || request.investmentHorizon() == null || request.investmentHorizon().isBlank()
                || request.allocations() == null || request.allocations().isEmpty()) {
            throw new PortfolioValidationException("Theme details and allocations are required");
        }
        if (request.allocations().stream().anyMatch(allocation -> allocation == null
                || allocation.assetClass() == null || allocation.percentage() == null
                || allocation.percentage().signum() < 0
                || allocation.percentage().compareTo(BigDecimal.valueOf(100)) > 0)) {
            throw new PortfolioValidationException("Asset class percentages must be between 0 and 100");
        }
        if (request.allocations().stream()
                .map(UpdateThemeDefinitionRequest.Allocation::assetClass)
                .distinct().count() != request.allocations().size()) {
            throw new PortfolioValidationException("Each asset class must be provided once");
        }
        BigDecimal total = request.allocations().stream()
                .map(UpdateThemeDefinitionRequest.Allocation::percentage)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (total.compareTo(BigDecimal.valueOf(100)) != 0) {
            throw new PortfolioValidationException("Asset class percentages must total 100%");
        }

        ThemeDefinition theme = themeRepository.findByTheme(themeCode)
                .orElseThrow(() -> new PortfolioValidationException("Investment theme is not configured"));
        theme.setLabel(request.label().trim());
        theme.setRisk(request.risk().trim());
        theme.setInvestmentHorizon(request.investmentHorizon().trim());
        theme.setDescription(request.description() == null ? null : request.description().trim());
        theme.getAllocations().clear();
        for (UpdateThemeDefinitionRequest.Allocation allocation : request.allocations()) {
            theme.addAllocation(ThemeAllocation.builder()
                    .assetClass(allocation.assetClass())
                    .percentage(allocation.percentage())
                    .build());
        }
        return toResponse(themeRepository.save(theme));
    }

    @Transactional
    public ThemeDefinitionResponse updateThemeConfiguration(
            InvestmentThemes themeCode, UpdateThemeConfigurationRequest request) {
        if (themeCode == null || request == null || request.label() == null || request.label().isBlank()
                || request.risk() == null || request.risk().isBlank()
                || request.investmentHorizon() == null || request.investmentHorizon().isBlank()
                || request.allocations() == null || request.allocations().isEmpty()
                || request.equityAllocations() == null || request.equityAllocations().size() != 3) {
            throw new PortfolioValidationException("Theme details and both allocation sets are required");
        }
        BigDecimal assetTotal = BigDecimal.ZERO;
        for (UpdateThemeConfigurationRequest.Allocation allocation : request.allocations()) {
            if (allocation == null || allocation.assetClass() == null || allocation.percentage() == null
                    || allocation.percentage().signum() < 0
                    || allocation.percentage().compareTo(BigDecimal.valueOf(100)) > 0) {
                throw new PortfolioValidationException("Asset class percentages must be between 0 and 100");
            }
            assetTotal = assetTotal.add(allocation.percentage());
        }
        if (request.allocations().stream().map(UpdateThemeConfigurationRequest.Allocation::assetClass)
                .distinct().count() != request.allocations().size()
                || assetTotal.compareTo(BigDecimal.valueOf(100)) != 0) {
            throw new PortfolioValidationException("Asset class allocations must be unique and total 100%");
        }

        BigDecimal equityTarget = request.allocations().stream()
                .filter(allocation -> allocation.assetClass() == AssetClass.EQUITY)
                .map(UpdateThemeConfigurationRequest.Allocation::percentage)
                .findFirst()
                .orElseThrow(() -> new PortfolioValidationException("Equity target is not configured"));
        BigDecimal equityTotal = BigDecimal.ZERO;
        for (UpdateThemeConfigurationRequest.EquityAllocation allocation : request.equityAllocations()) {
            if (allocation == null || allocation.equityCategory() == null || allocation.percentage() == null
                    || allocation.percentage().signum() < 0
                    || allocation.percentage().compareTo(BigDecimal.valueOf(100)) > 0) {
                throw new PortfolioValidationException("Equity category percentages must be between 0 and 100");
            }
            equityTotal = equityTotal.add(allocation.percentage());
        }
        if (request.equityAllocations().stream()
                .map(UpdateThemeConfigurationRequest.EquityAllocation::equityCategory)
                .distinct().count() != 3 || equityTotal.compareTo(equityTarget) != 0) {
            throw new PortfolioValidationException(
                    "Equity category allocations must be unique and total the EQUITY target");
        }

        ThemeDefinition theme = themeRepository.findByTheme(themeCode)
                .orElseThrow(() -> new PortfolioValidationException("Investment theme is not configured"));
        theme.setLabel(request.label().trim());
        theme.setRisk(request.risk().trim());
        theme.setInvestmentHorizon(request.investmentHorizon().trim());
        theme.setDescription(request.description() == null ? null : request.description().trim());
        theme.getAllocations().clear();
        request.allocations().forEach(allocation -> theme.addAllocation(ThemeAllocation.builder()
                .assetClass(allocation.assetClass()).percentage(allocation.percentage()).build()));
        theme.getEquityAllocations().clear();
        request.equityAllocations().forEach(allocation -> theme.addEquityAllocation(ThemeEquityAllocation.builder()
                .equityCategory(allocation.equityCategory()).percentage(allocation.percentage()).build()));
        return toResponse(themeRepository.save(theme));
    }

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
                    .map(allocation -> new ThemeEquityAllocationResponse(
                        allocation.getEquityCategory(), allocation.getPercentage()))
                    .toList(),
                theme.getRisk(),
                theme.getInvestmentHorizon(),
                theme.getDescription());
    }
}
