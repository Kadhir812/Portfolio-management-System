package com.hexaware.portfolio.portfolio_backend.service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.hexaware.portfolio.portfolio_backend.dto.AddSecurityRequest;
import com.hexaware.portfolio.portfolio_backend.dto.EligibleSecurityResponse;
import com.hexaware.portfolio.portfolio_backend.dto.ThemeDefinitionResponse;
import com.hexaware.portfolio.portfolio_backend.entity.Portfolio;
import com.hexaware.portfolio.portfolio_backend.entity.PortfolioHolding;
import com.hexaware.portfolio.portfolio_backend.entity.enums.AssetClass;
import com.hexaware.portfolio.portfolio_backend.exceptions.HoldingGuardrailException;
import com.hexaware.portfolio.portfolio_backend.exceptions.PortfolioNotFoundException;
import com.hexaware.portfolio.portfolio_backend.exceptions.PortfolioValidationException;
import com.hexaware.portfolio.portfolio_backend.exceptions.SecurityNotFoundException;
import com.hexaware.portfolio.portfolio_backend.exceptions.ThemeNotAttachedException;
import com.hexaware.portfolio.portfolio_backend.repository.PortfolioHoldingRepository;
import com.hexaware.portfolio.portfolio_backend.repository.PortfolioRepository;
import com.hexaware.portfolio.portfolio_backend.repository.ThemeRepository;
import com.hexaware.portfolio.security.entity.AssetType;
import com.hexaware.portfolio.security.entity.DailyPrice;
import com.hexaware.portfolio.security.entity.SecurityDetails;
import com.hexaware.portfolio.security.repository.DailyPriceRepository;
import com.hexaware.portfolio.security.repository.SecurityDetailsRepository;

@Service
public class PortfolioHoldingService {

    private final PortfolioHoldingRepository holdingRepository;
    private final PortfolioRepository portfolioRepository;
    private final ThemeRepository themeRepository;
    private final SecurityDetailsRepository securityRepository;
    private final DailyPriceRepository dailyPriceRepository;

    public PortfolioHoldingService(
            PortfolioHoldingRepository holdingRepository,
            PortfolioRepository portfolioRepository,
            ThemeRepository themeRepository,
            SecurityDetailsRepository securityRepository,
            DailyPriceRepository dailyPriceRepository) {
        this.holdingRepository = holdingRepository;
        this.portfolioRepository = portfolioRepository;
        this.themeRepository = themeRepository;
        this.securityRepository = securityRepository;
        this.dailyPriceRepository = dailyPriceRepository;
    }

    public PortfolioHolding addSecurity(String portfolioId, AddSecurityRequest request) {
        validateRequest(request);

        Portfolio portfolio = findPortfolio(portfolioId);
        if (portfolio.getTheme() == null) {
            throw new ThemeNotAttachedException(portfolioId);
        }
        if (portfolio.isHoldingsSaved()) {
            throw new HoldingGuardrailException("Portfolio holdings have already been saved");
        }
        if (portfolio.getAmount() == null || portfolio.getAmount() <= 0) {
            throw new HoldingGuardrailException("Portfolio amount must be greater than zero");
        }

        SecurityDetails security = securityRepository.findByIsin(request.isin().trim())
                .orElseThrow(() -> new SecurityNotFoundException(request.isin()));
        DailyPrice dailyPrice = dailyPriceRepository.findTopByIsinOrderByTradeDateDesc(security.getIsin())
                .orElseThrow(() -> new HoldingGuardrailException(
                        "No price is available for security: " + security.getIsin()));

        BigDecimal price = priceFrom(dailyPrice);
        BigDecimal value = request.shares().multiply(price);
        AssetClass assetClass = toAssetClass(security.getAssetType());
        ThemeDefinitionResponse theme = themeRepository.findByTheme(portfolio.getTheme());
        double allocationLimit = theme.allocations().stream()
                .filter(allocation -> allocation.assetClass() == assetClass)
                .mapToDouble(allocation -> allocation.percentage())
                .findFirst()
                .orElse(0);

        BigDecimal existingValue = holdingRepository.findByPortfolioId(portfolioId).stream()
                .filter(holding -> holding.getAssetClass() == assetClass)
                .map(PortfolioHolding::getValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal proposedValue = existingValue.add(value);
        BigDecimal maximumValue = BigDecimal.valueOf(portfolio.getAmount())
                .multiply(BigDecimal.valueOf(allocationLimit))
                .divide(BigDecimal.valueOf(100));

        if (proposedValue.compareTo(maximumValue) > 0) {
            throw new HoldingGuardrailException(
                    "Adding this security exceeds the " + allocationLimit + "% " + assetClass
                            + " limit for the " + portfolio.getTheme() + " theme");
        }

        Instant now = Instant.now();
        PortfolioHolding holding = PortfolioHolding.builder()
                .portfolioId(portfolioId)
                .isin(security.getIsin())
                .securityName(security.getDescription())
                .symbol(security.getSymbol())
                .assetClass(assetClass)
                .shares(request.shares())
                .price(price)
                .value(value)
                .priceDate(dailyPrice.getTradeDate())
                .createdAt(now)
                .updatedAt(now)
                .build();
        return holdingRepository.save(holding);
    }

    public Portfolio saveHoldings(String portfolioId) {
        Portfolio portfolio = findPortfolio(portfolioId);
        if (portfolio.getTheme() == null) {
            throw new ThemeNotAttachedException(portfolioId);
        }
        if (portfolio.getAmount() == null || portfolio.getAmount() <= 0) {
            throw new HoldingGuardrailException("Portfolio amount must be greater than zero");
        }

        List<PortfolioHolding> holdings = holdingRepository.findByPortfolioId(portfolioId);
        if (holdings.isEmpty()) {
            throw new HoldingGuardrailException("At least one holding is required before saving");
        }

        Map<AssetClass, BigDecimal> valueByAssetClass = holdings.stream()
                .collect(Collectors.groupingBy(
                        PortfolioHolding::getAssetClass,
                        Collectors.mapping(
                                PortfolioHolding::getValue,
                                Collectors.reducing(BigDecimal.ZERO, BigDecimal::add))));
        ThemeDefinitionResponse theme = themeRepository.findByTheme(portfolio.getTheme());
        BigDecimal portfolioAmount = BigDecimal.valueOf(portfolio.getAmount());
        BigDecimal tolerance = new BigDecimal("0.01");

        for (var allocation : theme.allocations()) {
            BigDecimal expectedValue = portfolioAmount
                    .multiply(BigDecimal.valueOf(allocation.percentage()))
                    .divide(BigDecimal.valueOf(100));
            BigDecimal actualValue = valueByAssetClass.getOrDefault(allocation.assetClass(), BigDecimal.ZERO);
            if (actualValue.subtract(expectedValue).abs().compareTo(tolerance) > 0) {
                throw new HoldingGuardrailException(
                        allocation.assetClass() + " allocation must equal " + allocation.percentage()
                                + "%. Expected value: " + expectedValue + ", actual value: " + actualValue);
            }
        }

        BigDecimal totalValue = holdings.stream()
                .map(PortfolioHolding::getValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (totalValue.subtract(portfolioAmount).abs().compareTo(tolerance) > 0) {
            throw new HoldingGuardrailException(
                    "Total holdings must equal the portfolio amount. Expected: "
                            + portfolioAmount + ", actual: " + totalValue);
        }

        portfolio.setHoldingsSaved(true);
        portfolio.setUpdatedAt(Instant.now());
        return portfolioRepository.save(portfolio);
    }

    public List<PortfolioHolding> getAll(String portfolioId) {
        findPortfolio(portfolioId);
        return holdingRepository.findByPortfolioId(portfolioId);
    }

    public List<EligibleSecurityResponse> getEligibleSecurities(String portfolioId) {
        Portfolio portfolio = findPortfolio(portfolioId);
        if (portfolio.getTheme() == null) {
            throw new ThemeNotAttachedException(portfolioId);
        }

        ThemeDefinitionResponse theme = themeRepository.findByTheme(portfolio.getTheme());
        List<AssetType> allowedTypes = theme.allocations().stream()
                .filter(allocation -> allocation.percentage() > 0)
                .map(allocation -> toAssetType(allocation.assetClass()))
                .toList();
        List<EligibleSecurityResponse> securities = new ArrayList<>();
        for (SecurityDetails security : securityRepository.findAllByAssetTypeIn(allowedTypes)) {
            DailyPrice latestPrice = dailyPriceRepository.findTopByIsinOrderByTradeDateDesc(security.getIsin())
                    .orElse(null);
            securities.add(new EligibleSecurityResponse(
                    security.getIsin(),
                    security.getSymbol(),
                    security.getDescription(),
                    toAssetClass(security.getAssetType()),
                    latestPrice == null ? null : priceFrom(latestPrice),
                    latestPrice == null ? null : latestPrice.getTradeDate()));
        }
        return securities;
    }

    public PortfolioHolding getById(String portfolioId, Long holdingId) {
        findPortfolio(portfolioId);
        return holdingRepository.findByIdAndPortfolioId(holdingId, portfolioId)
                .orElseThrow(() -> new HoldingGuardrailException("Holding not found: " + holdingId));
    }

    public void delete(String portfolioId, Long holdingId) {
        holdingRepository.delete(getById(portfolioId, holdingId));
        Portfolio portfolio = findPortfolio(portfolioId);
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

    private void validateRequest(AddSecurityRequest request) {
        if (request == null || request.isin() == null || request.isin().isBlank()) {
            throw new PortfolioValidationException("Security ISIN is required");
        }
        if (request.shares() == null || request.shares().compareTo(BigDecimal.ZERO) <= 0) {
            throw new PortfolioValidationException("Shares must be greater than zero");
        }
    }

    private BigDecimal priceFrom(DailyPrice dailyPrice) {
        if (dailyPrice.getClosePrice() != null) {
            return dailyPrice.getClosePrice();
        }
        if (dailyPrice.getLastPrice() != null) {
            return dailyPrice.getLastPrice();
        }
        throw new HoldingGuardrailException("Latest security price is unavailable");
    }

    private AssetClass toAssetClass(AssetType assetType) {
        return switch (assetType) {
            case EQUITY -> AssetClass.STOCKS;
            case MUTUAL -> AssetClass.MUTUAL_FUNDS;
            case COMMODITY -> AssetClass.COMMODITIES;
            case BOND -> AssetClass.BONDS;
            case CRYPTO -> AssetClass.CRYPTO;
            case REIT -> AssetClass.REITS;
            case ETF -> AssetClass.ETFS;
            case CASH -> AssetClass.CASH;
        };
    }

    private AssetType toAssetType(AssetClass assetClass) {
        return switch (assetClass) {
            case STOCKS -> AssetType.EQUITY;
            case MUTUAL_FUNDS -> AssetType.MUTUAL;
            case COMMODITIES -> AssetType.COMMODITY;
            case BONDS -> AssetType.BOND;
            case CRYPTO -> AssetType.CRYPTO;
            case REITS -> AssetType.REIT;
            case ETFS -> AssetType.ETF;
            case CASH -> AssetType.CASH;
        };
    }
}
