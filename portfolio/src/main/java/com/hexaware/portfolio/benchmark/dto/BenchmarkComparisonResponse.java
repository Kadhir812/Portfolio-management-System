package com.hexaware.portfolio.benchmark.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import com.hexaware.portfolio.benchmark.entity.BenchmarkDailyPrice;
import com.hexaware.portfolio.benchmark.entity.BenchmarkIndex;

public record BenchmarkComparisonResponse(
        String indexCode,
        String indexName,
        String currency,
        LocalDate from,
        LocalDate to,
        List<DailyPrice> prices) {

    public record DailyPrice(
            LocalDate date,
            BigDecimal open,
            BigDecimal high,
            BigDecimal low,
            BigDecimal close,
            BigDecimal prevClose,
            BigDecimal changeValue,
            BigDecimal changePercent,
            Long volume) {
        public static DailyPrice from(BenchmarkDailyPrice price) {
            return new DailyPrice(price.getTradeDate(), price.getOpenValue(), price.getHighValue(),
                    price.getLowValue(), price.getCloseValue(), price.getPrevClose(), price.getChangeValue(),
                    price.getChangePercent(), price.getVolume());
        }
    }

    public static BenchmarkComparisonResponse from(BenchmarkIndex index, LocalDate from, LocalDate to,
            List<BenchmarkDailyPrice> prices) {
        return new BenchmarkComparisonResponse(index.getIndexCode(), index.getIndexName(), index.getCurrency(),
                from, to, prices.stream().map(DailyPrice::from).toList());
    }
}
