package com.hexaware.portfolio.batch.writer;

import java.util.ArrayList;
import java.util.List;

import org.springframework.batch.infrastructure.item.Chunk;
import org.springframework.batch.infrastructure.item.ItemWriter;
import org.springframework.stereotype.Component;

import com.hexaware.portfolio.security.entity.DailyPrice;
import com.hexaware.portfolio.security.repository.DailyPriceRepository;

@Component
public class HistoricalPriceWriter implements ItemWriter<DailyPrice> {

    private final DailyPriceRepository repository;

    public HistoricalPriceWriter(DailyPriceRepository repository) {
        this.repository = repository;
    }

    @Override
    public void write(Chunk<? extends DailyPrice> chunk) {
        List<DailyPrice> rows = new ArrayList<>(chunk.size());
        for (DailyPrice incoming : chunk) {
            DailyPrice stored = repository.findByIsinAndTradeDate(
                    incoming.getIsin(), incoming.getTradeDate()).orElseGet(DailyPrice::new);
            stored.setIsin(incoming.getIsin());
            stored.setTradeDate(incoming.getTradeDate());
            stored.setPrevClose(incoming.getPrevClose());
            stored.setOpenPrice(incoming.getOpenPrice());
            stored.setHighPrice(incoming.getHighPrice());
            stored.setLowPrice(incoming.getLowPrice());
            stored.setLastPrice(incoming.getLastPrice());
            stored.setClosePrice(incoming.getClosePrice());
            rows.add(stored);
        }
        repository.saveAll(rows);
    }
}
