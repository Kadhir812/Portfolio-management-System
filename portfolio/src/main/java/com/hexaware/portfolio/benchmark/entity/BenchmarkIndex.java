package com.hexaware.portfolio.benchmark.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "benchmark_indices", uniqueConstraints = {
        @UniqueConstraint(name = "uk_benchmark_indices_index_code", columnNames = "index_code")
})
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BenchmarkIndex {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "benchmark_id")
    private Long benchmarkId;

    @Column(name = "index_code", nullable = false, length = 30)
    private String indexCode;

    @Column(name = "index_name", nullable = false, length = 100)
    private String indexName;

    @Column(length = 50)
    private String symbol;

    @Column(length = 50)
    private String exchange;

    @Column(length = 50)
    private String country;

    @Column(length = 10)
    private String currency;

    @Column(length = 500)
    private String description;

    @Column(name = "base_value", precision = 20, scale = 6)
    private BigDecimal baseValue;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "benchmarkIndex", cascade = CascadeType.ALL, orphanRemoval = true)
    @lombok.ToString.Exclude
    @lombok.EqualsAndHashCode.Exclude
    @Builder.Default
    private List<BenchmarkDailyPrice> dailyPrices = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
