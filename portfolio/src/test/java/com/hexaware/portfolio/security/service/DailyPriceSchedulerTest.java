package com.hexaware.portfolio.security.service;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.Test;

import com.hexaware.portfolio.security.repository.DailyPriceRepository;
import com.hexaware.portfolio.security.repository.SecurityDetailsRepository;

import tools.jackson.databind.ObjectMapper;

class DailyPriceSchedulerTest {
    @Test
    void disabledSchedulerDoesNotReadSecurities() {
        SecurityDetailsRepository securities = mock(SecurityDetailsRepository.class);
        DailyPriceScheduler scheduler = new DailyPriceScheduler(mock(ObjectMapper.class), securities,
                mock(DailyPriceRepository.class), "  ", "UTC");

        scheduler.fetchDailyPrices();

        verify(securities, never()).findAll();
    }

    @Test
    void schedulerWithNoSecuritiesMakesNoPriceRequests() {
        SecurityDetailsRepository securities = mock(SecurityDetailsRepository.class);
        DailyPriceRepository prices = mock(DailyPriceRepository.class);
        when(securities.findAll()).thenReturn(List.of());
        DailyPriceScheduler scheduler = new DailyPriceScheduler(mock(ObjectMapper.class), securities,
                prices, "https://example.invalid/{symbol}?from={from}&to={to}", "UTC");

        scheduler.fetchDailyPrices();

        verify(securities).findAll();
        verify(prices, never()).findTopBySecurityIdOrderByTradeDateDesc(org.mockito.ArgumentMatchers.anyLong());
    }
}