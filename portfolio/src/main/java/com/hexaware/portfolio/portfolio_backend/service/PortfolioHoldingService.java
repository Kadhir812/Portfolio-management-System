package com.hexaware.portfolio.portfolio_backend.service;

import java.math.*;
import java.time.*;
import java.util.*;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hexaware.portfolio.portfolio_backend.dto.*;
import com.hexaware.portfolio.portfolio_backend.entity.*;
import com.hexaware.portfolio.portfolio_backend.entity.enums.AssetClass;
import com.hexaware.portfolio.portfolio_backend.exceptions.*;
import com.hexaware.portfolio.portfolio_backend.repository.*;
import com.hexaware.portfolio.portfolio_backend.security.CurrentUserService;
import com.hexaware.portfolio.security.entity.*;
import com.hexaware.portfolio.security.repository.*;

@Service
public class PortfolioHoldingService {
    private static final BigDecimal ZERO = BigDecimal.ZERO;
    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);
    private final PortfolioRepository portfolios;
    private final PortfolioHoldingRepository holdings;
    private final PortfolioTradeRepository trades;
    private final SecurityDetailsRepository securities;
    private final DailyPriceRepository prices;
    private final ThemeRepository themes;
    private final CurrentUserService currentUser;

    public PortfolioHoldingService(PortfolioRepository portfolios, PortfolioHoldingRepository holdings,
            PortfolioTradeRepository trades, SecurityDetailsRepository securities, DailyPriceRepository prices,
            ThemeRepository themes, CurrentUserService currentUser) {
        this.portfolios = portfolios; this.holdings = holdings; this.trades = trades;
        this.securities = securities; this.prices = prices; this.themes = themes; this.currentUser = currentUser;
    }

    public List<PortfolioHolding> getAll(Long portfolioId) { ownPortfolio(portfolioId); return holdings.findByPortfolioId(portfolioId); }
    public PortfolioHolding getById(Long portfolioId, Long holdingId) {
        ownPortfolio(portfolioId);
        return holdings.findByIdAndPortfolioId(holdingId, portfolioId).orElseThrow(() -> new PortfolioValidationException("Holding not found"));
    }
    public PortfolioHoldingSummaryResponse getSummary(Long portfolioId) {
        List<PortfolioHolding> rows = getAll(portfolioId);
        return new PortfolioHoldingSummaryResponse(rows.size(), rows.stream().map(PortfolioHolding::getValue).filter(Objects::nonNull).reduce(ZERO, BigDecimal::add));
    }
    public List<EligibleSecurityResponse> getEligibleSecurities(Long portfolioId) {
        return getEligibleSecurities(portfolioId, null);
    }
    public List<EligibleSecurityResponse> getEligibleSecurities(Long portfolioId, LocalDate asOfDate) {
        Portfolio portfolio = ownPortfolio(portfolioId);
        Set<AssetClass> allowedAssetClasses = allowedAssetClasses(portfolio);
        return securities.findAll().stream().map(s -> {
            AssetClass assetClass = assetClass(s.getAssetType());
            if (!allowedAssetClasses.isEmpty() && !allowedAssetClasses.contains(assetClass)) return null;
            Optional<DailyPrice> p = asOfDate == null ? Optional.ofNullable(latestPrice(s.getSecurityId())) : prices.findTopBySecurityIdAndTradeDateLessThanEqualOrderByTradeDateDesc(s.getSecurityId(), asOfDate);
            return p.map(price -> new EligibleSecurityResponse(s.getIsin(), s.getSymbol(), s.getDescription(), assetClass, priceValue(price), price.getTradeDate())).orElse(null);
        }).filter(Objects::nonNull).toList();
    }

    @Transactional
    public PortfolioHolding addSecurity(Long portfolioId, AddSecurityRequest request) {
        Portfolio p = ownPortfolio(portfolioId);
        if (request == null || request.isin() == null || request.shares() == null || request.shares().signum() <= 0) throw new PortfolioValidationException("A security and positive share quantity are required");
        SecurityDetails s = securities.findByIsin(request.isin()).orElseThrow(() -> new SecurityNotFoundException(request.isin()));
        Set<AssetClass> allowedAssetClasses = allowedAssetClasses(p);
        if (!allowedAssetClasses.isEmpty() && !allowedAssetClasses.contains(assetClass(s.getAssetType()))) {
            throw new PortfolioValidationException("This security is not part of the portfolio's investment theme");
        }
        if (holdings.findByPortfolioId(portfolioId).stream().anyMatch(h -> h.getIsin().equals(request.isin()))) throw new PortfolioValidationException("This security is already in the portfolio");
        LocalDate transactionDate = p.isHoldingsSaved() ? LocalDate.now() : (p.getPurchaseDate() == null ? LocalDate.now() : p.getPurchaseDate());
        DailyPrice price = priceOnOrBefore(s.getSecurityId(), transactionDate);
        BigDecimal unitPrice = priceValue(price);
        PortfolioHolding holding = PortfolioHolding.builder().portfolioId(portfolioId).isin(s.getIsin()).symbol(s.getSymbol())
                .securityName(s.getName()).assetClass(assetClass(s.getAssetType())).shares(request.shares())
                .price(unitPrice).value(unitPrice.multiply(request.shares()).setScale(2, RoundingMode.HALF_UP))
                .priceDate(price.getTradeDate()).createdAt(Instant.now()).updatedAt(Instant.now()).build();
        PortfolioHolding saved = holdings.save(holding);
        if (p.isHoldingsSaved()) recordTrade(portfolioId, s, saved.getAssetClass(), saved.getShares(), unitPrice, transactionDate);
        return saved;
    }

    @Transactional
    public Portfolio saveHoldings(Long portfolioId) {
        Portfolio p = ownPortfolio(portfolioId);
        List<PortfolioHolding> rows = holdings.findByPortfolioId(portfolioId);
        if (rows.isEmpty()) throw new PortfolioValidationException("Add at least one holding before saving");
        if (!p.isHoldingsSaved()) {
            for (PortfolioHolding h : rows) {
                trades.save(PortfolioTrade.builder().portfolioId(portfolioId).isin(h.getIsin()).symbol(h.getSymbol())
                        .securityName(h.getSecurityName()).assetClass(h.getAssetClass()).signedShares(h.getShares())
                        .unitPrice(h.getPrice()).tradeDate(p.getPurchaseDate()).createdAt(Instant.now()).build());
            }
            p.setHoldingsSaved(true); p.setUpdatedAt(Instant.now());
            portfolios.save(p);
        }
        return p;
    }

    @Transactional
    public PortfolioHolding update(Long portfolioId, Long holdingId, UpdateHoldingRequest request) {
        PortfolioHolding row = getById(portfolioId, holdingId);
        if (request == null || request.shares() == null || request.shares().signum() <= 0) throw new PortfolioValidationException("Shares must be greater than zero");
        BigDecimal delta = request.shares().subtract(row.getShares());
        Portfolio p = ownPortfolio(portfolioId);
        if (p.isHoldingsSaved() && delta.signum() != 0) {
            SecurityDetails security = securities.findByIsin(row.getIsin()).orElseThrow(() -> new SecurityNotFoundException(row.getIsin()));
            LocalDate date = LocalDate.now();
            BigDecimal price = priceValue(priceOnOrBefore(security.getSecurityId(), date));
            recordTrade(portfolioId, security, row.getAssetClass(), delta, price, date);
            row.setPrice(price); row.setPriceDate(priceOnOrBefore(security.getSecurityId(), date).getTradeDate());
        }
        row.setShares(request.shares()); row.setValue(row.getPrice().multiply(row.getShares()).setScale(2, RoundingMode.HALF_UP)); row.setUpdatedAt(Instant.now());
        return holdings.save(row);
    }
    @Transactional
    public void delete(Long portfolioId, Long holdingId) {
        PortfolioHolding row = getById(portfolioId, holdingId);
        if (ownPortfolio(portfolioId).isHoldingsSaved()) {
            SecurityDetails security = securities.findByIsin(row.getIsin()).orElseThrow(() -> new SecurityNotFoundException(row.getIsin()));
            LocalDate date = LocalDate.now();
            BigDecimal price = priceValue(priceOnOrBefore(security.getSecurityId(), date));
            recordTrade(portfolioId, security, row.getAssetClass(), row.getShares().negate(), price, date);
        }
        holdings.delete(row);
    }

    @Transactional
    public PortfolioValuationResponse getValuation(Long portfolioId, LocalDate requestedDate) {
        Portfolio p = ownPortfolio(portfolioId);
        if (!p.isHoldingsSaved()) throw new PortfolioValidationException("Save portfolio holdings before opening the historical dashboard");
        ensureTradeHistory(p);
        LocalDate purchase = p.getPurchaseDate();
        LocalDate requested = requestedDate == null ? LocalDate.now() : requestedDate;
        if (requested.isBefore(purchase)) throw new PortfolioValidationException("Dashboard date cannot be before the purchase date");
        List<PortfolioTrade> history = trades.findByPortfolioIdAndTradeDateLessThanEqualOrderByTradeDateAscIdAsc(portfolioId, requested);
        if (history.isEmpty()) throw new PortfolioValidationException("No portfolio trades exist on or before this date");
        Map<String, BigDecimal> quantities = new LinkedHashMap<>();
        Map<String, PortfolioTrade> metadata = new HashMap<>();
        Map<String, BigDecimal> costs = new HashMap<>();
        Map<String, BigDecimal> bought = new HashMap<>();
        for (PortfolioTrade t : history) {
            quantities.merge(t.getIsin(), t.getSignedShares(), BigDecimal::add); metadata.put(t.getIsin(), t);
            if (t.getSignedShares().signum() > 0) { costs.merge(t.getIsin(), t.getSignedShares().multiply(t.getUnitPrice()), BigDecimal::add); bought.merge(t.getIsin(), t.getSignedShares(), BigDecimal::add); }
        }
        List<PortfolioValuationResponse.HoldingValuation> output = new ArrayList<>();
        Map<AssetClass, BigDecimal> classValues = new EnumMap<>(AssetClass.class);
        BigDecimal total = ZERO, totalCost = ZERO;
        LocalDate effective = requested;
        for (var entry : quantities.entrySet()) {
            if (entry.getValue().signum() <= 0) continue;
            PortfolioTrade t = metadata.get(entry.getKey());
            SecurityDetails security = securities.findByIsin(t.getIsin()).orElseThrow(() -> new SecurityNotFoundException(t.getIsin()));
            DailyPrice daily = priceOnOrBefore(security.getSecurityId(), requested);
            BigDecimal currentPrice = priceValue(daily), value = currentPrice.multiply(entry.getValue()).setScale(2, RoundingMode.HALF_UP);
            BigDecimal averageCost = bought.getOrDefault(entry.getKey(), ZERO).signum() == 0 ? ZERO : costs.get(entry.getKey()).divide(bought.get(entry.getKey()), 6, RoundingMode.HALF_UP);
            BigDecimal gain = currentPrice.subtract(averageCost).multiply(entry.getValue()).setScale(2, RoundingMode.HALF_UP);
            output.add(new PortfolioValuationResponse.HoldingValuation(t.getIsin(), t.getSymbol(), t.getSecurityName(), t.getAssetClass(), entry.getValue(), averageCost, currentPrice, daily.getTradeDate(), value, gain));
            classValues.merge(t.getAssetClass(), value, BigDecimal::add); total = total.add(value); totalCost = totalCost.add(averageCost.multiply(entry.getValue()));
            if (daily.getTradeDate().isBefore(effective)) effective = daily.getTradeDate();
        }
        List<PortfolioValuationResponse.AllocationDrift> allocation = new ArrayList<>();
        if (p.getTheme() != null) {
            for (ThemeAllocationResponse target : themes.findByTheme(p.getTheme()).allocations()) {
                BigDecimal current = total.signum() == 0 ? ZERO : classValues.getOrDefault(target.assetClass(), ZERO).multiply(HUNDRED).divide(total, 2, RoundingMode.HALF_UP);
                BigDecimal targetPct = BigDecimal.valueOf(target.percentage());
                BigDecimal drift = current.subtract(targetPct).setScale(2, RoundingMode.HALF_UP);
                allocation.add(new PortfolioValuationResponse.AllocationDrift(target.assetClass(), targetPct, current, drift, drift.abs().compareTo(BigDecimal.valueOf(5)) > 0));
            }
        }
        BigDecimal gains = total.subtract(totalCost).setScale(2, RoundingMode.HALF_UP);
        return new PortfolioValuationResponse(purchase, requested, effective, total.setScale(2, RoundingMode.HALF_UP), gains, output, allocation, availableDates(portfolioId, purchase));
    }

    @Transactional
    public void rebalance(Long portfolioId, RebalanceRequest request) {
        Portfolio p = ownPortfolio(portfolioId);
        ensureTradeHistory(p);
        if (request == null || request.tradeDate() == null || request.trades() == null || request.trades().isEmpty()) throw new PortfolioValidationException("Trade date and at least one trade are required");
        if (request.tradeDate().isBefore(p.getPurchaseDate()) || request.tradeDate().isAfter(LocalDate.now())) throw new PortfolioValidationException("Trade date must be between purchase date and today");
        Map<String, BigDecimal> quantitiesAtTradeDate = new HashMap<>();
        for (PortfolioTrade prior : trades.findByPortfolioIdAndTradeDateLessThanEqualOrderByTradeDateAscIdAsc(portfolioId, request.tradeDate())) {
            quantitiesAtTradeDate.merge(prior.getIsin(), prior.getSignedShares(), BigDecimal::add);
        }
        Map<String, BigDecimal> requestedTrades = new LinkedHashMap<>();
        for (RebalanceRequest.TradeOrder order : request.trades()) {
            if (order.isin() != null && order.signedShares() != null) requestedTrades.merge(order.isin(), order.signedShares(), BigDecimal::add);
        }
        for (var order : requestedTrades.entrySet()) {
            BigDecimal signedShares = order.getValue();
            if (signedShares.signum() == 0) continue;
            SecurityDetails security = securities.findByIsin(order.getKey()).orElseThrow(() -> new SecurityNotFoundException(order.getKey()));
            BigDecimal afterTrade = quantitiesAtTradeDate.getOrDefault(order.getKey(), ZERO).add(signedShares);
            if (afterTrade.signum() < 0) throw new PortfolioValidationException("Cannot sell more shares than the portfolio owns: " + security.getSymbol());
            DailyPrice price = priceOnOrBefore(security.getSecurityId(), request.tradeDate());
            recordTrade(portfolioId, security, assetClass(security.getAssetType()), signedShares, priceValue(price), request.tradeDate());
        }
        refreshHoldingSnapshots(portfolioId);
    }

    private List<LocalDate> availableDates(Long portfolioId, LocalDate purchase) {
        Set<LocalDate> dates = new TreeSet<>();
        dates.add(purchase);
        for (PortfolioTrade trade : trades.findAllByPortfolioId(portfolioId)) {
            securities.findByIsin(trade.getIsin()).ifPresent(s -> prices.findBySecurityId(s.getSecurityId()).stream()
                    .map(DailyPrice::getTradeDate).filter(d -> !d.isBefore(purchase)).forEach(dates::add));
        }
        return List.copyOf(dates);
    }
    private void ensureTradeHistory(Portfolio portfolio) {
        if (trades.existsByPortfolioId(portfolio.getId())) return;
        List<PortfolioHolding> existing = holdings.findByPortfolioId(portfolio.getId());
        if (existing.isEmpty()) return;
        LocalDate purchase = portfolio.getPurchaseDate();
        if (purchase == null) {
            purchase = existing.stream().map(PortfolioHolding::getPriceDate).filter(Objects::nonNull).min(LocalDate::compareTo).orElse(LocalDate.now());
            portfolio.setPurchaseDate(purchase);
            portfolios.save(portfolio);
        }
        for (PortfolioHolding holding : existing) {
            SecurityDetails security = securities.findByIsin(holding.getIsin()).orElseThrow(() -> new SecurityNotFoundException(holding.getIsin()));
            BigDecimal price = priceValue(priceOnOrBefore(security.getSecurityId(), purchase));
            recordTrade(portfolio.getId(), security, holding.getAssetClass(), holding.getShares(), price, purchase);
        }
    }
    private void refreshHoldingSnapshots(Long portfolioId) {
        List<PortfolioTrade> allTrades = trades.findAllByPortfolioId(portfolioId).stream()
                .sorted(Comparator.comparing(PortfolioTrade::getTradeDate).thenComparing(PortfolioTrade::getId)).toList();
        Map<String, BigDecimal> quantities = new HashMap<>();
        Map<String, PortfolioTrade> metadata = new HashMap<>();
        allTrades.forEach(t -> { quantities.merge(t.getIsin(), t.getSignedShares(), BigDecimal::add); metadata.put(t.getIsin(), t); });
        Map<String, PortfolioHolding> rows = new HashMap<>();
        holdings.findByPortfolioId(portfolioId).forEach(h -> rows.put(h.getIsin(), h));
        for (String isin : quantities.keySet()) {
            BigDecimal shares = quantities.get(isin);
            PortfolioHolding row = rows.get(isin);
            if (shares.signum() <= 0) { if (row != null) holdings.delete(row); continue; }
            PortfolioTrade last = metadata.get(isin);
            SecurityDetails security = securities.findByIsin(isin).orElseThrow(() -> new SecurityNotFoundException(isin));
            DailyPrice price = latestPrice(security.getSecurityId());
            if (price == null) throw new PortfolioValidationException("No market price is available for " + security.getSymbol());
            BigDecimal unitPrice = priceValue(price);
            if (row == null) row = PortfolioHolding.builder().portfolioId(portfolioId).isin(isin).createdAt(Instant.now()).build();
            row.setSymbol(last.getSymbol()); row.setSecurityName(last.getSecurityName()); row.setAssetClass(last.getAssetClass());
            row.setShares(shares); row.setPrice(unitPrice); row.setPriceDate(price.getTradeDate());
            row.setValue(unitPrice.multiply(shares).setScale(2, RoundingMode.HALF_UP)); row.setUpdatedAt(Instant.now());
            holdings.save(row);
        }
    }
    private DailyPrice latestPrice(Long securityId) { return prices.findTopBySecurityIdOrderByTradeDateDesc(securityId).orElse(null); }
    private void recordTrade(Long portfolioId, SecurityDetails security, AssetClass assetClass, BigDecimal quantity, BigDecimal price, LocalDate date) {
        trades.save(PortfolioTrade.builder().portfolioId(portfolioId).isin(security.getIsin()).symbol(security.getSymbol())
                .securityName(security.getName()).assetClass(assetClass).signedShares(quantity).unitPrice(price)
                .tradeDate(date).createdAt(Instant.now()).build());
    }
    private DailyPrice priceOnOrBefore(Long securityId, LocalDate date) {
        return prices.findTopBySecurityIdAndTradeDateLessThanEqualOrderByTradeDateDesc(securityId, date)
                .orElseThrow(() -> new PortfolioValidationException("No historical price is available on or before " + date));
    }
    private BigDecimal priceValue(DailyPrice p) {
        BigDecimal value = p.getValuationPrice() != null ? p.getValuationPrice() : p.getClosePrice() != null ? p.getClosePrice() : p.getNav() != null ? p.getNav() : p.getSpotPrice();
        if (value == null || value.signum() <= 0) throw new PortfolioValidationException("Historical price is missing or invalid");
        return value;
    }
    private Portfolio ownPortfolio(Long id) {
        if (id == null) throw new PortfolioValidationException("Portfolio id is required");
        return portfolios.findByIdAndOwnerUsername(id, currentUser.getCurrentUser().getUsername()).orElseThrow(() -> new PortfolioNotFoundException(id));
    }
    private AssetClass assetClass(AssetType type) {
        return switch (type) { case EQUITY -> AssetClass.STOCKS; case MUTUAL -> AssetClass.MUTUAL_FUNDS; case COMMODITY -> AssetClass.COMMODITIES; case BOND -> AssetClass.BONDS; case CRYPTO -> AssetClass.CRYPTO; case REIT -> AssetClass.REITS; case ETF -> AssetClass.ETFS; case CASH -> AssetClass.CASH; };
    }
    private Set<AssetClass> allowedAssetClasses(Portfolio portfolio) {
        if (portfolio.getTheme() == null) return Set.of();
        return themes.findByTheme(portfolio.getTheme()).allocations().stream()
                .map(ThemeAllocationResponse::assetClass)
                .collect(java.util.stream.Collectors.toSet());
    }
}
