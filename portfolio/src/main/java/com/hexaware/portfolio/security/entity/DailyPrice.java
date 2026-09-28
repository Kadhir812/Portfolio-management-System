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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
        name = "security_id",
        referencedColumnName = "security_id",
        insertable = false,
        updatable = false
    )
    private SecurityDetails securityDetails;

    @Column(name = "trade_date", nullable = false)
    private LocalDate tradeDate;

    private BigDecimal openPrice;
    private BigDecimal highPrice;
    private BigDecimal lowPrice;
    private BigDecimal closePrice;
    private BigDecimal prevClose;
    private BigDecimal lastPrice;

    private Long volume;

    private BigDecimal nav;
    private BigDecimal spotPrice;
    private BigDecimal valuationPrice;
}
