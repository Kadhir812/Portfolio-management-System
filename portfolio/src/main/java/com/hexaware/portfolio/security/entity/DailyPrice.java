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

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "stocks_daily_prices", uniqueConstraints = {
    @UniqueConstraint(name = "uk_daily_price_isin_date", columnNames = { "isin", "trade_date" })
})
public class DailyPrice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "isin", nullable = false, length = 12)
    private String isin;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "isin", referencedColumnName = "isin", insertable = false, updatable = false)
    private SecurityDetails securityDetails;

    @Column(name = "trade_date", nullable = false)
    private LocalDate tradeDate;

    @Column(name = "open_price")
    private BigDecimal openPrice;

    @Column(name = "high_price")
    private BigDecimal highPrice;

    @Column(name = "low_price")
    private BigDecimal lowPrice;

    @Column(name = "close_price")
    private BigDecimal closePrice;

    @Column(name = "prev_close")
    private BigDecimal prevClose;

    @Column(name = "last_price")
    private BigDecimal lastPrice;

    @Column(name = "volume")
    private Long volume;

    @Column(name = "nav")
    private BigDecimal nav;
}