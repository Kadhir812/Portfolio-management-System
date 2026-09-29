package com.hexaware.portfolio.portfolio_backend.service.holdings;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Objects;

import org.springframework.stereotype.Service;

import com.hexaware.portfolio.portfolio_backend.entity.PortfolioHolding;
import com.hexaware.portfolio.portfolio_backend.entity.PortfolioTrade;
import com.hexaware.portfolio.portfolio_backend.entity.enums.AssetClass;
import com.hexaware.portfolio.portfolio_backend.exceptions.PortfolioValidationException;
import com.hexaware.portfolio.portfolio_backend.exceptions.SecurityNotFoundException;
import com.hexaware.portfolio.security.entity.AssetType;
import com.hexaware.portfolio.security.entity.DailyPrice;
import com.hexaware.portfolio.security.entity.SecurityDetails;
import com.hexaware.portfolio.security.repository.DailyPriceRepository;
import com.hexaware.portfolio.security.repository.SecurityDetailsRepository;

@Service
public class HoldingSecurityService {
    private final SecurityDetailsRepository securities;
    private final DailyPriceRepository prices;

    public HoldingSecurityService(SecurityDetailsRepository securities, DailyPriceRepository prices) {
        this.securities = securities;
        this.prices = prices;
    }

    public SecurityDetails resolveHolding(PortfolioHolding holding) {
        if (holding.getSecurityId() != null) {
            return securities.findById(holding.getSecurityId())
                    .orElseThrow(() -> new SecurityNotFoundException(String.valueOf(holding.getSecurityId())));
        }
        return securities.findByIsin(holding.getIsin())
                .orElseThrow(() -> new SecurityNotFoundException(holding.getIsin()));
    }

    public SecurityDetails resolveTrade(PortfolioTrade trade) {
        if (trade.getSecurityId() != null) {
            return securities.findById(trade.getSecurityId())
                    .orElseThrow(() -> new SecurityNotFoundException(String.valueOf(trade.getSecurityId())));
        }
        return securities.findByIsin(trade.getIsin())
                .orElseThrow(() -> new SecurityNotFoundException(trade.getIsin()));
    }

    public boolean sameSecurity(PortfolioHolding holding, SecurityDetails security) {
        if (holding.getSecurityId() != null) return holding.getSecurityId().equals(security.getSecurityId());
        return Objects.equals(holding.getIsin(), security.getIsin())
                || Objects.equals(holding.getSymbol(), security.getSymbol());
    }

    public AssetClass assetClass(AssetType type) {
        return switch (type) {
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

    public DailyPrice latestPrice(Long securityId) {
        return prices.findTopBySecurityIdOrderByTradeDateDesc(securityId).orElse(null);
    }

    public DailyPrice priceOnOrBefore(Long securityId, LocalDate date) {
        return prices.findTopBySecurityIdAndTradeDateLessThanEqualOrderByTradeDateDesc(securityId, date)
                .orElseThrow(() -> new PortfolioValidationException("No historical price is available on or before " + date));
    }

    public BigDecimal priceValue(DailyPrice price) {
        BigDecimal value = price.getValuationPrice() != null ? price.getValuationPrice()
                : price.getClosePrice() != null ? price.getClosePrice()
                : price.getNav() != null ? price.getNav() : price.getSpotPrice();
        if (value == null || value.signum() <= 0) throw new PortfolioValidationException("Historical price is missing or invalid");
        return value;
    }

    public Long tradeSecurityId(PortfolioTrade trade) {
        return resolveTrade(trade).getSecurityId();
    }
}
