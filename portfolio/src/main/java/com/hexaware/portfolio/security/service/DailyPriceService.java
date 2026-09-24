package com.hexaware.portfolio.security.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.hexaware.portfolio.security.entity.DailyPrice;
import com.hexaware.portfolio.security.repository.DailyPriceRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DailyPriceService {

    private final DailyPriceRepository repo;

    public List<DailyPrice> getByIsin(String isin) {
        return repo.findByIsin(isin);
    }

    public List<DailyPrice> getByIsinRange(String isin, LocalDate from, LocalDate to) {
        return repo.findByIsinAndTradeDateBetween(isin, from, to);
    }

    public Optional<DailyPrice> getByIsinAndTradeDate(String isin, LocalDate date) {
        return repo.findByIsinAndTradeDate(isin, date);
    }

    public Optional<LocalDate> lastLoadedDate(String isin) {
        return repo.findTopByIsinOrderByTradeDateDesc(isin)
                .map(DailyPrice::getTradeDate);
    }

    public boolean hasAny(String isin) {
        return repo.existsByIsin(isin);
    }

    public DailyPrice save(DailyPrice entity) {
        return repo.save(entity);
    }

    public List<DailyPrice> saveAll(List<DailyPrice> rows) {
        return repo.saveAll(rows);
    }
}