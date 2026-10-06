package com.hexaware.portfolio.security.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.hexaware.portfolio.security.entity.DailyPrice;
import com.hexaware.portfolio.security.repository.DailyPriceRepository;

class DailyPriceServiceTest {
    private DailyPriceRepository repository;
    private DailyPriceService service;

    @BeforeEach
    void setUp() {
        repository = mock(DailyPriceRepository.class);
        service = new DailyPriceService(repository);
    }

    @Test
    void readsPricesBySecurityAndDateRange() {
        LocalDate from = LocalDate.of(2025, 1, 1);
        LocalDate to = from.plusDays(10);
        List<DailyPrice> rows = List.of(mock(DailyPrice.class));
        when(repository.findBySecurityId(2L)).thenReturn(rows);
        when(repository.findBySecurityIdAndTradeDateBetween(2L, from, to)).thenReturn(rows);

        assertEquals(rows, service.getBySecurityId(2L));
        assertEquals(rows, service.getBySecurityIdRange(2L, from, to));
    }

    @Test
    void readsExactAndLatestDates() {
        LocalDate date = LocalDate.of(2025, 2, 3);
        DailyPrice price = mock(DailyPrice.class);
        when(price.getTradeDate()).thenReturn(date);
        when(repository.findBySecurityIdAndTradeDate(3L, date)).thenReturn(Optional.of(price));
        when(repository.findTopBySecurityIdOrderByTradeDateDesc(3L)).thenReturn(Optional.of(price));

        assertEquals(Optional.of(price), service.getBySecurityIdAndTradeDate(3L, date));
        assertEquals(Optional.of(date), service.lastLoadedDate(3L));
        when(repository.findTopBySecurityIdOrderByTradeDateDesc(4L)).thenReturn(Optional.empty());
        assertTrue(service.lastLoadedDate(4L).isEmpty());
    }

    @Test
    void checksAndPersistsPriceRows() {
        DailyPrice price = mock(DailyPrice.class);
        List<DailyPrice> rows = List.of(price);
        when(repository.existsBySecurityId(5L)).thenReturn(true);
        when(repository.save(price)).thenReturn(price);
        when(repository.saveAll(rows)).thenReturn(rows);

        assertTrue(service.hasAny(5L));
        assertEquals(price, service.save(price));
        assertEquals(rows, service.saveAll(rows));
        verify(repository).existsBySecurityId(5L);
    }
}