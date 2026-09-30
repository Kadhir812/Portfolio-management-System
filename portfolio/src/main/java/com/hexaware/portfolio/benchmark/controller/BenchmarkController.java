package com.hexaware.portfolio.benchmark.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.hexaware.portfolio.benchmark.dto.BenchmarkComparisonResponse;
import com.hexaware.portfolio.benchmark.dto.BenchmarkResponse;
import com.hexaware.portfolio.benchmark.service.BenchmarkService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/benchmarks")
@RequiredArgsConstructor
public class BenchmarkController {
    private final BenchmarkService benchmarkService;

    @GetMapping
    public ResponseEntity<List<BenchmarkResponse>> getBenchmarks() {
        return ResponseEntity.ok(benchmarkService.getAllBenchmarks());
    }

    @GetMapping("/{indexCode}")
    public ResponseEntity<BenchmarkResponse> getBenchmark(@PathVariable String indexCode) {
        return ResponseEntity.ok(benchmarkService.getBenchmark(indexCode));
    }

    @GetMapping("/{indexCode}/prices")
    public ResponseEntity<BenchmarkComparisonResponse> getPrices(
            @PathVariable String indexCode,
            @RequestParam LocalDate from,
            @RequestParam LocalDate to) {
        return ResponseEntity.ok(benchmarkService.getPrices(indexCode, from, to));
    }
}
