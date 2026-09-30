package com.hexaware.portfolio.benchmark.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.hexaware.portfolio.benchmark.entity.BenchmarkIndex;

public interface BenchmarkIndexRepository extends JpaRepository<BenchmarkIndex, Long> {
    Optional<BenchmarkIndex> findByIndexCode(String indexCode);

    List<BenchmarkIndex> findAllByOrderByBenchmarkIdAsc();
}
