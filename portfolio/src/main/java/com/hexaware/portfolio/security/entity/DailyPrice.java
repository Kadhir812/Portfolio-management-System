package com.hexaware.portfolio.security.entity;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "stoks_daily_prices")
public class DailyPrice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "isin", nullable = false, length = 12)
    private String isin;

    @Column(name = "trade_date", nullable = false)
    private LocalDate tradeDate;

    @Column(name = "open_price")
    private Double openPrice;

    @Column(name = "high_price")
    private Double highPrice;

    @Column(name = "low_price")
    private Double lowPrice;

    @Column(name = "close_price")
    private Double closePrice;

    @Column(name = "prev_close")
    private Double prevClose;

    @Column(name = "volume")
    private Long volume;

    @Column(name = "deliverable_qty")
    private Long deliverableQty;

    @Column(name = "nav")
    private Double nav;
}