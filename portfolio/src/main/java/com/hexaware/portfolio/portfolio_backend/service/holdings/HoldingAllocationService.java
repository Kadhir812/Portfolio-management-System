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
import com.hexaware.portfolio.portfolio_backend.exceptions.PortfolioValidationException;
import com.hexaware.portfolio.portfolio_backend.repository.PortfolioHoldingRepository;
import com.hexaware.portfolio.portfolio_backend.repository.ThemeRepository;
import com.hexaware.portfolio.security.entity.EquityCategory;

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
        return themes.findByTheme(portfolio.getTheme()).orElseThrow().getAllocations().stream()
                .map(ThemeAllocation::getAssetClass)
                .collect(Collectors.toSet());
    }

        public void ensureDoesNotExceedTarget(Portfolio portfolio, AssetClass assetClass,
                        EquityCategory equityCategory,
            BigDecimal proposedValue, PortfolioHolding excludedHolding) {
        if (portfolio.getTheme() == null) return;
                var theme = themes.findByTheme(portfolio.getTheme()).orElseThrow();
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

        if (assetClass == AssetClass.EQUITY && equityCategory != null) {
            ThemeEquityAllocation categoryTarget = theme.getEquityAllocations().stream()
                    .filter(allocation -> allocation.getEquityCategory() == equityCategory)
                    .findFirst().orElse(null);
            if (categoryTarget != null) {
                BigDecimal currentCategoryValue = holdings.findByPortfolioId(portfolio.getId()).stream()
                        .filter(holding -> holding != excludedHolding
                                && holding.getAssetClass() == AssetClass.EQUITY
                                && holding.getEquityCategory() == equityCategory)
                        .map(PortfolioHolding::getValue)
                        .filter(Objects::nonNull)
                        .reduce(ZERO, BigDecimal::add);
                BigDecimal categoryTargetValue = portfolio.getAmount()
                        .multiply(categoryTarget.getPercentage())
                        .divide(HUNDRED, 2, RoundingMode.HALF_UP);
                if (currentCategoryValue.add(proposedValue).compareTo(categoryTargetValue.add(BigDecimal.ONE)) > 0) {
                    throw new PortfolioValidationException(equityCategory
                            + " holdings cannot exceed the theme target of "
                            + categoryTarget.getPercentage() + "%");
                }
            }
        }

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
    }
}
