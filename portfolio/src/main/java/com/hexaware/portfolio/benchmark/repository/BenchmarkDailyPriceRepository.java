package com.hexaware.portfolio.benchmark.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.hexaware.portfolio.benchmark.entity.BenchmarkDailyPrice;

public interface BenchmarkDailyPriceRepository extends JpaRepository<BenchmarkDailyPrice, Long> {
    List<BenchmarkDailyPrice> findByBenchmarkIndex_BenchmarkIdAndTradeDateBetweenOrderByTradeDateAsc(
            Long benchmarkId, LocalDate from, LocalDate to);
}
