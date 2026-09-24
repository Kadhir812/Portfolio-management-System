package com.hexaware.portfolio.batch.processor;

import org.springframework.batch.infrastructure.item.ItemProcessor;

import com.hexaware.portfolio.batch.model.HistoricalPriceRow;
import com.hexaware.portfolio.security.entity.DailyPrice;

public class HistoricalPriceProcessor implements ItemProcessor<HistoricalPriceRow, DailyPrice> {

    private final String isin;
    private final String symbol;
    private final String series;

    public HistoricalPriceProcessor(String isin, String symbol, String series) {
        this.isin = isin;
        this.symbol = symbol;
        this.series = series;
    }

    @Override
    public DailyPrice process(HistoricalPriceRow row) {
        if (!symbol.equalsIgnoreCase(row.symbol()) || !series.equalsIgnoreCase(row.series())) {
            return null;
        }
        return DailyPrice.builder()
                .isin(isin)
                .tradeDate(row.tradeDate())
                .prevClose(row.prevClose())
                .openPrice(row.openPrice())
                .highPrice(row.highPrice())
                .lowPrice(row.lowPrice())
                .lastPrice(row.lastPrice())
                .closePrice(row.closePrice())
                .build();
    }
}
