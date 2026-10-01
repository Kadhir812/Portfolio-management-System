package com.hexaware.portfolio.benchmark.entity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

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
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "benchmark_daily_prices", uniqueConstraints = {
        @UniqueConstraint(name = "uk_benchmark_daily_price_date", columnNames = { "benchmark_id", "trade_date" })
})
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BenchmarkDailyPrice {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "benchmark_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_benchmark_daily_prices_index"))
    @lombok.ToString.Exclude
    @lombok.EqualsAndHashCode.Exclude
    private BenchmarkIndex benchmarkIndex;

    @Column(name = "trade_date", nullable = false)
    private LocalDate tradeDate;

    @Column(name = "open_value", precision = 20, scale = 6)
    private BigDecimal openValue;

    @Column(name = "high_value", precision = 20, scale = 6)
    private BigDecimal highValue;

    @Column(name = "low_value", precision = 20, scale = 6)
    private BigDecimal lowValue;

    @Column(name = "close_value", precision = 20, scale = 6)
    private BigDecimal closeValue;

    @Column(name = "prev_close", precision = 20, scale = 6)
    private BigDecimal prevClose;

    @Column(name = "change_value", precision = 20, scale = 6)
    private BigDecimal changeValue;

    @Column(name = "change_percent", precision = 12, scale = 6)
    private BigDecimal changePercent;

    @Column(name = "volume")
    private Long volume;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @jakarta.persistence.PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
