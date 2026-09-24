package com.hexaware.portfolio.security.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.hexaware.portfolio.security.entity.SecurityDetails;

@Repository
public interface SecurityDetailsRepository extends JpaRepository<SecurityDetails, String> {

    Optional<SecurityDetails> findByIsin(String isin);

    Optional<SecurityDetails> findBySymbol(String symbol);

    Optional<SecurityDetails> findBySymbolAndSeries(String symbol, String series);
}