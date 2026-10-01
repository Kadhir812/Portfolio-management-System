package com.hexaware.portfolio.security.repository;

import java.util.Optional;
import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;

import com.hexaware.portfolio.security.entity.AssetType;
import com.hexaware.portfolio.security.entity.SecurityDetails;


public interface SecurityDetailsRepository extends JpaRepository<SecurityDetails, Long> {

    @Override
    @EntityGraph(attributePaths = { "gicsIndustry", "assetClassMaster" })
    List<SecurityDetails> findAll();

    Optional<SecurityDetails> findByIsin(String isin);

    Optional<SecurityDetails> findBySymbol(String symbol);

    Optional<SecurityDetails> findFirstBySymbolIgnoreCaseOrderBySecurityIdAsc(String symbol);

    Optional<SecurityDetails> findByExchangeIgnoreCaseAndIsinIgnoreCase(String exchange, String isin);

    Optional<SecurityDetails> findFirstByExchangeIgnoreCaseAndCupidIgnoreCase(String exchange, String cupid);

    Optional<SecurityDetails> findBySymbolAndSeries(String symbol, String series);

    List<SecurityDetails> findAllByAssetTypeIn(Collection<AssetType> assetTypes);

    @EntityGraph(attributePaths = "gicsIndustry")
    List<SecurityDetails> findAllByGicsIndustry_SectorCodeOrderBySymbolAsc(String sectorCode);

    @EntityGraph(attributePaths = "gicsIndustry")
    List<SecurityDetails> findAllByGicsIndustry_IndustryCodeOrderBySymbolAsc(String industryCode);

    @EntityGraph(attributePaths = "gicsIndustry")
    List<SecurityDetails> findAllByGicsIndustry_SectorCodeAndGicsIndustry_IndustryCodeOrderBySymbolAsc(
            String sectorCode, String industryCode);
}