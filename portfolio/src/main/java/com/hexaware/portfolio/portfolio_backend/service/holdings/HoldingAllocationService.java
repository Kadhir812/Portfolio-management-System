package com.hexaware.portfolio.portfolio_backend.service.holdings;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.hexaware.portfolio.portfolio_backend.entity.Portfolio;
import com.hexaware.portfolio.portfolio_backend.entity.PortfolioHolding;
import com.hexaware.portfolio.portfolio_backend.entity.ThemeAllocation;
import com.hexaware.portfolio.portfolio_backend.entity.ThemeEquityAllocation;
import com.hexaware.portfolio.portfolio_backend.entity.enums.AssetClass;
import com.hexaware.portfolio.portfolio_backend.entity.enums.EquityCategory;
import com.hexaware.portfolio.portfolio_backend.exceptions.PortfolioValidationException;
import com.hexaware.portfolio.portfolio_backend.repository.PortfolioHoldingRepository;
import com.hexaware.portfolio.portfolio_backend.repository.ThemeRepository;

import lombok.AllArgsConstructor;


@Service
@AllArgsConstructor 
public class HoldingAllocationService {
    private static final BigDecimal ZERO = BigDecimal.ZERO;
    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);
    private final PortfolioHoldingRepository holdings;
    private final ThemeRepository themes;

    public Set<AssetClass> allowedAssetClasses(Portfolio portfolio) {
        if (portfolio.getTheme() == null) return Set.of();
        return themes.findByTheme(portfolio.getTheme())
                .orElseThrow(() -> new PortfolioValidationException("Investment theme is not configured"))
                .getAllocations().stream()
                .map(ThemeAllocation::getAssetClass)
                .collect(Collectors.toSet());
    }

    public void ensureDoesNotExceedTarget(Portfolio portfolio, AssetClass assetClass,
            BigDecimal proposedValue, PortfolioHolding excludedHolding) {
        ensureDoesNotExceedTarget(portfolio, assetClass, null, proposedValue, excludedHolding);
    }

    public void ensureDoesNotExceedTarget(Portfolio portfolio, AssetClass assetClass, EquityCategory equityCategory,
            BigDecimal proposedValue, PortfolioHolding excludedHolding) {
        if (portfolio.getTheme() == null) return;
        var theme = themes.findByTheme(portfolio.getTheme())
                .orElseThrow(() -> new PortfolioValidationException("Investment theme is not configured"));
        ThemeAllocation target = theme.getAllocations().stream()
                .filter(allocation -> allocation.getAssetClass() == assetClass)
                .findFirst().orElse(null);
        if (target == null) return;

        BigDecimal currentValue = holdings.findByPortfolioId(portfolio.getId()).stream()
                .filter(holding -> holding != excludedHolding && holding.getAssetClass() == assetClass)
                .map(PortfolioHolding::getValue).filter(Objects::nonNull).reduce(ZERO, BigDecimal::add);
        BigDecimal targetValue = portfolio.getAmount()
                .multiply(target.getPercentage())
                .divide(HUNDRED, 2, RoundingMode.HALF_UP);
        BigDecimal proposedAllocation = currentValue.add(proposedValue);

        if (assetClass == AssetClass.CASH) {
            BigDecimal currentTotal = holdings.findByPortfolioId(portfolio.getId()).stream()
                    .filter(holding -> holding != excludedHolding).map(PortfolioHolding::getValue)
                    .filter(Objects::nonNull).reduce(ZERO, BigDecimal::add);
            BigDecimal residualAfterAddition = portfolio.getAmount()
                    .subtract(currentTotal.add(proposedValue)).max(ZERO);
            proposedAllocation = currentValue.add(proposedValue).add(residualAfterAddition);
        }
        if (proposedAllocation.compareTo(targetValue.add(BigDecimal.ONE)) > 0) {
            throw new PortfolioValidationException(assetClass + " holdings cannot exceed the theme target of " + target.getPercentage() + "%");
        }

        if (assetClass == AssetClass.STOCKS && !theme.getEquityAllocations().isEmpty()) {
            if (equityCategory == null) {
                throw new PortfolioValidationException("Choose an equity category: large, mid, or small cap");
            }
            ThemeEquityAllocation categoryTarget = theme.getEquityAllocations().stream()
                    .filter(allocation -> allocation.getEquityCategory() == equityCategory)
                    .findFirst()
                    .orElseThrow(() -> new PortfolioValidationException("Equity category is not configured for this theme"));
            BigDecimal currentCategoryValue = holdings.findByPortfolioId(portfolio.getId()).stream()
                    .filter(holding -> holding != excludedHolding && holding.getAssetClass() == AssetClass.STOCKS
                            && holding.getEquityCategory() == equityCategory)
                    .map(PortfolioHolding::getValue).filter(Objects::nonNull).reduce(ZERO, BigDecimal::add);
            BigDecimal categoryLimit = portfolio.getAmount().multiply(target.getPercentage())
                    .multiply(categoryTarget.getPercentage())
                    .divide(HUNDRED.multiply(HUNDRED), 2, RoundingMode.HALF_UP);
            if (currentCategoryValue.add(proposedValue).compareTo(categoryLimit.add(BigDecimal.ONE)) > 0) {
                throw new PortfolioValidationException(equityCategory + " holdings cannot exceed the theme target of "
                        + categoryTarget.getPercentage() + "%");
            }
        }
    }
}
