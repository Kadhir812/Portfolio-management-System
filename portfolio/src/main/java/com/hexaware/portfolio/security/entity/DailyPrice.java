package com.hexaware.portfolio.security.entity;

import java.time.LocalDate;
import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.ForeignKey;
import org.hibernate.annotations.Check;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(
    name = "daily_prices",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_daily_price_security_date",
            columnNames = {"security_id", "trade_date"}
        )
    }
)
@Check(name = "ck_daily_prices_valid_values", constraints = "((valuation_price IS NOT NULL AND valuation_price > 0) OR (close_price IS NOT NULL AND close_price > 0) OR (nav IS NOT NULL AND nav > 0) OR (spot_price IS NOT NULL AND spot_price > 0) OR (last_price IS NOT NULL AND last_price > 0)) AND (open_price IS NULL OR open_price > 0) AND (high_price IS NULL OR high_price > 0) AND (low_price IS NULL OR low_price > 0) AND (prev_close IS NULL OR prev_close > 0) AND (last_price IS NULL OR last_price > 0) AND (close_price IS NULL OR close_price > 0) AND (nav IS NULL OR nav > 0) AND (spot_price IS NULL OR spot_price > 0) AND (valuation_price IS NULL OR valuation_price > 0) AND (volume IS NULL OR volume >= 0) AND (high_price IS NULL OR low_price IS NULL OR high_price >= low_price)")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyPrice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "security_id", nullable = false)
    private Long securityId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
        name = "security_id",
        referencedColumnName = "security_id",
        insertable = false,
        updatable = false,
        nullable = false,
        foreignKey = @ForeignKey(name = "fk_daily_prices_security")
    )
    private SecurityDetails securityDetails;

    @Column(name = "trade_date", nullable = false)
    private LocalDate tradeDate;

    @Column(name = "open_price", precision = 20, scale = 6)
    private BigDecimal openPrice;

    @Column(name = "high_price", precision = 20, scale = 6)
    private BigDecimal highPrice;

    @Column(name = "low_price", precision = 20, scale = 6)
    private BigDecimal lowPrice;

    @Column(name = "close_price", precision = 20, scale = 6)
    private BigDecimal closePrice;

    @Column(name = "prev_close", precision = 20, scale = 6)
    private BigDecimal prevClose;

    @Column(name = "last_price", precision = 20, scale = 6)
    private BigDecimal lastPrice;

    @Column(name = "volume")
    private Long volume;

    @Column(name = "nav", precision = 20, scale = 6)
    private BigDecimal nav;

    @Column(name = "spot_price", precision = 20, scale = 6)
    private BigDecimal spotPrice;

    @Column(name = "valuation_price", precision = 20, scale = 6)
    private BigDecimal valuationPrice;

    public void validateMarketData() {
        if (!isPositive(valuationPrice) && !isPositive(closePrice) && !isPositive(nav)
                && !isPositive(spotPrice) && !isPositive(lastPrice)) {
            throw new IllegalArgumentException("Daily price must contain a positive valuation, close, NAV, spot, or last price");
        }
        if (!isValidOptionalPrice(openPrice) || !isValidOptionalPrice(highPrice)
                || !isValidOptionalPrice(lowPrice) || !isValidOptionalPrice(prevClose)
                || !isValidOptionalPrice(lastPrice) || !isValidOptionalPrice(closePrice)
                || !isValidOptionalPrice(nav) || !isValidOptionalPrice(spotPrice)
                || !isValidOptionalPrice(valuationPrice)) {
            throw new IllegalArgumentException("Daily price fields must be positive when provided");
        }
        if (volume != null && volume < 0) {
            throw new IllegalArgumentException("Daily price volume cannot be negative");
        }
        if (highPrice != null && lowPrice != null && highPrice.compareTo(lowPrice) < 0) {
            throw new IllegalArgumentException("Daily high price cannot be below the low price");
        }
    }

    private static boolean isPositive(BigDecimal value) {
        return value != null && value.signum() > 0;
    }

    private static boolean isValidOptionalPrice(BigDecimal value) {
        return value == null || value.signum() > 0;
    }
}
