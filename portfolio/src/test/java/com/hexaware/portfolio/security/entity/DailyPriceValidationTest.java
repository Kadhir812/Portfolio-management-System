package com.hexaware.portfolio.security.entity;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;

class DailyPriceValidationTest {

    @Test
    void acceptsSparseRowWithUsableClosePrice() {
        DailyPrice price = DailyPrice.builder()
                .closePrice(new BigDecimal("12.50"))
                .build();

        assertDoesNotThrow(price::validateMarketData);
    }

    @Test
    void rejectsRowWithoutUsableValuationPrice() {
        DailyPrice price = DailyPrice.builder()
                .openPrice(new BigDecimal("10.00"))
                .build();

        assertThrows(IllegalArgumentException.class, price::validateMarketData);
    }

    @Test
    void rejectsNonpositiveProvidedPriceEvenWhenCloseIsValid() {
        DailyPrice price = DailyPrice.builder()
                .closePrice(new BigDecimal("12.50"))
                .lastPrice(BigDecimal.ZERO)
                .build();

        assertThrows(IllegalArgumentException.class, price::validateMarketData);
    }

    @Test
    void rejectsHighPriceBelowLowPrice() {
        DailyPrice price = DailyPrice.builder()
                .closePrice(new BigDecimal("12.50"))
                .highPrice(new BigDecimal("11.00"))
                .lowPrice(new BigDecimal("12.00"))
                .build();

        assertThrows(IllegalArgumentException.class, price::validateMarketData);
    }
}