package com.hexaware.portfolio.security.repository;

import java.util.Optional;
import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.hexaware.portfolio.security.entity.AssetType;
import com.hexaware.portfolio.security.entity.SecurityDetails;


public interface SecurityDetailsRepository extends JpaRepository<SecurityDetails, Long> {

    @EntityGraph(attributePaths = "gicsIndustry")
    @Override
    List<SecurityDetails> findAll();

    Optional<SecurityDetails> findByIsin(String isin);

    Optional<SecurityDetails> findBySymbol(String symbol);

    @EntityGraph(attributePaths = "gicsIndustry")
    Optional<SecurityDetails> findFirstBySymbolIgnoreCaseOrderBySecurityIdAsc(String symbol);

    @EntityGraph(attributePaths = "gicsIndustry")
    Optional<SecurityDetails> findByExchangeIgnoreCaseAndIsinIgnoreCase(String exchange, String isin);

    Optional<SecurityDetails> findBySymbolAndSeries(String symbol, String series);

    List<SecurityDetails> findAllByAssetTypeIn(Collection<AssetType> assetTypes);
}