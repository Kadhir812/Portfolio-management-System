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

        @EntityGraph(attributePaths = { "gicsIndustry", "assetClassMaster" })
        List<SecurityDetails> findTop50ByNameContainingIgnoreCaseOrSymbolContainingIgnoreCaseOrIsinContainingIgnoreCaseOrCupidContainingIgnoreCaseOrderByNameAsc(
            String name, String symbol, String isin, String cupid);

    @EntityGraph(attributePaths = { "gicsIndustry", "assetClassMaster" })
    Optional<SecurityDetails> findByIsin(String isin);

    @EntityGraph(attributePaths = { "gicsIndustry", "assetClassMaster" })
    Optional<SecurityDetails> findBySymbol(String symbol);

    @EntityGraph(attributePaths = { "gicsIndustry", "assetClassMaster" })
    Optional<SecurityDetails> findFirstBySymbolIgnoreCaseOrderBySecurityIdAsc(String symbol);

    @EntityGraph(attributePaths = { "gicsIndustry", "assetClassMaster" })
    Optional<SecurityDetails> findByExchangeIgnoreCaseAndIsinIgnoreCase(String exchange, String isin);

    @EntityGraph(attributePaths = { "gicsIndustry", "assetClassMaster" })
    Optional<SecurityDetails> findFirstByExchangeIgnoreCaseAndCupidIgnoreCase(String exchange, String cupid);

    @EntityGraph(attributePaths = { "gicsIndustry", "assetClassMaster" })
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