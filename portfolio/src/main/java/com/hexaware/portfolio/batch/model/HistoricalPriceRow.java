package com.hexaware.portfolio.batch.model;

import java.math.BigDecimal;
import java.time.LocalDate;

public record HistoricalPriceRow(
        String symbol,
        String series,
        LocalDate tradeDate,
        BigDecimal prevClose,
        BigDecimal openPrice,
        BigDecimal highPrice,
        BigDecimal lowPrice,
        BigDecimal lastPrice,
        BigDecimal closePrice) {
}
