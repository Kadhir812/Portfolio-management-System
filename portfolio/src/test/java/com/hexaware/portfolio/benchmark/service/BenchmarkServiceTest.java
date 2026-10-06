package com.hexaware.portfolio.benchmark.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.hexaware.portfolio.benchmark.dto.BenchmarkComparisonResponse;
import com.hexaware.portfolio.benchmark.dto.BenchmarkResponse;
import com.hexaware.portfolio.benchmark.entity.BenchmarkDailyPrice;
import com.hexaware.portfolio.benchmark.entity.BenchmarkIndex;
import com.hexaware.portfolio.benchmark.repository.BenchmarkDailyPriceRepository;
import com.hexaware.portfolio.benchmark.repository.BenchmarkIndexRepository;

class BenchmarkServiceTest {
    private BenchmarkIndexRepository benchmarkIndexes;
    private BenchmarkDailyPriceRepository dailyPrices;
    private BenchmarkService benchmarkService;
    private BenchmarkIndex index;

    @BeforeEach
    void setUp() {
        benchmarkIndexes = mock(BenchmarkIndexRepository.class);
        dailyPrices = mock(BenchmarkDailyPriceRepository.class);
        benchmarkService = new BenchmarkService(benchmarkIndexes, dailyPrices);
        index = new BenchmarkIndex();
        index.setBenchmarkId(4L);
        index.setIndexCode("NIFTY50");
        index.setIndexName("NIFTY 50");
        index.setCurrency("INR");
        index.setStatus("ACTIVE");
    }

    @Test
    void getAllBenchmarksMapsRepositoryResults() {
        when(benchmarkIndexes.findAllByOrderByBenchmarkIdAsc()).thenReturn(List.of(index));

        List<BenchmarkResponse> result = benchmarkService.getAllBenchmarks();

        assertEquals(1, result.size());
        assertEquals("NIFTY50", result.get(0).indexCode());
        assertEquals(4L, result.get(0).benchmarkId());
    }

    @Test
    void getBenchmarkNormalizesCodeBeforeLookup() {
        when(benchmarkIndexes.findByIndexCode("NIFTY50")).thenReturn(Optional.of(index));

        BenchmarkResponse result = benchmarkService.getBenchmark("  nifty50 ");

        assertEquals("NIFTY50", result.indexCode());
        verify(benchmarkIndexes).findByIndexCode("NIFTY50");
    }

    @Test
    void getBenchmarkRejectsBlankAndUnknownCodes() {
        ResponseStatusException blank = assertThrows(ResponseStatusException.class,
                () -> benchmarkService.getBenchmark("  "));
        when(benchmarkIndexes.findByIndexCode("MISSING")).thenReturn(Optional.empty());
        ResponseStatusException missing = assertThrows(ResponseStatusException.class,
                () -> benchmarkService.getBenchmark("missing"));

        assertEquals(HttpStatus.BAD_REQUEST, blank.getStatusCode());
        assertEquals(HttpStatus.NOT_FOUND, missing.getStatusCode());
    }

    @Test
    void getPricesRejectsMissingOrReversedDates() {
        ResponseStatusException missing = assertThrows(ResponseStatusException.class,
                () -> benchmarkService.getPrices("NIFTY50", null, LocalDate.now()));
        ResponseStatusException reversed = assertThrows(ResponseStatusException.class,
                () -> benchmarkService.getPrices("NIFTY50", LocalDate.now(), LocalDate.now().minusDays(1)));

        assertEquals(HttpStatus.BAD_REQUEST, missing.getStatusCode());
        assertEquals(HttpStatus.BAD_REQUEST, reversed.getStatusCode());
    }

    @Test
    void getPricesMapsRowsForRequestedBenchmarkAndDateRange() {
        LocalDate from = LocalDate.of(2025, 1, 1);
        LocalDate to = from.plusDays(1);
        BenchmarkDailyPrice price = new BenchmarkDailyPrice();
        price.setTradeDate(from);
        price.setCloseValue(new BigDecimal("23000.500000"));
        when(benchmarkIndexes.findByIndexCode("NIFTY50")).thenReturn(Optional.of(index));
        when(dailyPrices.findByBenchmarkIndex_BenchmarkIdAndTradeDateBetweenOrderByTradeDateAsc(4L, from, to))
                .thenReturn(List.of(price));

        BenchmarkComparisonResponse result = benchmarkService.getPrices("nifty50", from, to);

        assertEquals("NIFTY50", result.indexCode());
        assertEquals(from, result.from());
        assertEquals(new BigDecimal("23000.500000"), result.prices().get(0).close());
        verify(dailyPrices).findByBenchmarkIndex_BenchmarkIdAndTradeDateBetweenOrderByTradeDateAsc(4L, from, to);
    }
}