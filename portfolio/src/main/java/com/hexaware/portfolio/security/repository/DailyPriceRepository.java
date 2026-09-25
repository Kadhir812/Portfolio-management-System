package com.hexaware.portfolio.security.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.hexaware.portfolio.security.entity.DailyPrice;


public interface DailyPriceRepository extends JpaRepository<DailyPrice, Long> {

    List<DailyPrice> findByIsin(String isin);

    List<DailyPrice> findByIsinAndTradeDateBetween(String isin, LocalDate from, LocalDate to);

    Optional<DailyPrice> findByIsinAndTradeDate(String isin, LocalDate date);

    Optional<DailyPrice> findTopByIsinOrderByTradeDateDesc(String isin);

    boolean existsByIsin(String isin);
}