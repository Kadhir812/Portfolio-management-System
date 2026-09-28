package com.hexaware.portfolio.batch.processor;

import org.springframework.batch.infrastructure.item.ItemProcessor;

import com.hexaware.portfolio.batch.model.HistoricalPriceRow;
import com.hexaware.portfolio.security.entity.DailyPrice;
import com.hexaware.portfolio.security.entity.AssetType;
import com.hexaware.portfolio.security.entity.SecurityDetails;
import com.hexaware.portfolio.security.repository.SecurityDetailsRepository;

public class HistoricalPriceProcessor implements ItemProcessor<HistoricalPriceRow, DailyPrice> {

    private final String isin;
    private final String symbol;
    private final String series;
    private final SecurityDetailsRepository securityDetailsRepository;

    public HistoricalPriceProcessor(String isin, String symbol, String series,
            SecurityDetailsRepository securityDetailsRepository) {
        this.isin = isin;
        this.symbol = symbol;
        this.series = series;
        this.securityDetailsRepository = securityDetailsRepository;
    }

    @Override
    public DailyPrice process(HistoricalPriceRow row) {
        if (!symbol.equalsIgnoreCase(row.symbol()) || !series.equalsIgnoreCase(row.series())) {
            return null;
        }
        SecurityDetails security = securityDetailsRepository.findByIsin(isin)
            .orElseThrow(() -> new IllegalStateException("Security not found for ISIN: " + isin));
        DailyPrice.DailyPriceBuilder price = DailyPrice.builder()
            .securityId(security.getSecurityId())
                .tradeDate(row.tradeDate())
                .prevClose(row.prevClose())
                .openPrice(row.openPrice())
                .highPrice(row.highPrice())
                .lowPrice(row.lowPrice())
                .lastPrice(row.lastPrice())
                .closePrice(row.closePrice());
        if (security.getAssetType() == AssetType.EQUITY) {
            price.valuationPrice(row.closePrice());
        }
        return price.build();
    }
}
