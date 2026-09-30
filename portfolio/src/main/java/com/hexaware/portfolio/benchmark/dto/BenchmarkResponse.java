package com.hexaware.portfolio.benchmark.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.hexaware.portfolio.benchmark.entity.BenchmarkIndex;

public record BenchmarkResponse(
        Long benchmarkId,
        String indexCode,
        String indexName,
        String symbol,
        String exchange,
        String country,
        String currency,
        String description,
        BigDecimal baseValue,
        String status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {

    public static BenchmarkResponse from(BenchmarkIndex index) {
        return new BenchmarkResponse(index.getBenchmarkId(), index.getIndexCode(), index.getIndexName(),
                index.getSymbol(), index.getExchange(), index.getCountry(), index.getCurrency(),
                index.getDescription(), index.getBaseValue(), index.getStatus(), index.getCreatedAt(),
                index.getUpdatedAt());
    }
}
