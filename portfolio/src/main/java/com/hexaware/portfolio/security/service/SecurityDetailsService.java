package com.hexaware.portfolio.security.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.hexaware.portfolio.security.entity.GicsIndustry;
import com.hexaware.portfolio.security.entity.SecurityDetails;
import com.hexaware.portfolio.security.repository.GicsIndustryRepository;
import com.hexaware.portfolio.security.repository.SecurityDetailsRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SecurityDetailsService {

    private final SecurityDetailsRepository repo;
    private final GicsIndustryRepository gicsIndustries;

    public Optional<SecurityDetails> getByIsin(String isin) {
        return repo.findByIsin(isin);
    }

    public Optional<SecurityDetails> getBySymbol(String symbol) {
        return repo.findBySymbol(symbol);
    }

    public Optional<SecurityDetails> findFirstBySymbol(String symbol) {
        return repo.findFirstBySymbolIgnoreCaseOrderBySecurityIdAsc(symbol);
    }

    public Optional<SecurityDetails> findByExchangeAndIsin(String exchange, String isin) {
        return repo.findByExchangeIgnoreCaseAndIsinIgnoreCase(exchange, isin);
    }

    public Optional<SecurityDetails> findByExchangeAndCupid(String exchange, String cupid) {
        Optional<SecurityDetails> security = repo.findFirstByExchangeIgnoreCaseAndCupidIgnoreCase(exchange, cupid);
        if (security.isPresent()) {
            return security;
        }

        if ("LSE".equalsIgnoreCase(exchange)) {
            return repo.findFirstByExchangeIgnoreCaseAndCupidIgnoreCase("LSEG", cupid);
        }
        if ("LSEG".equalsIgnoreCase(exchange)) {
            return repo.findFirstByExchangeIgnoreCaseAndCupidIgnoreCase("LSE", cupid);
        }
        return Optional.empty();
    }

    public Optional<SecurityDetails> getBySymbolAndSeries(String symbol, String series) {
        return repo.findBySymbolAndSeries(symbol, series);
    }

    public List<SecurityDetails> findAll() {
        return repo.findAll();
    }

    public List<SecurityDetails> search(String query) {
        String value = query.trim();
        return repo.findTop50ByNameContainingIgnoreCaseOrSymbolContainingIgnoreCaseOrIsinContainingIgnoreCaseOrCupidContainingIgnoreCaseOrderByNameAsc(
                value, value, value, value);
    }

    public List<SecurityDetails> findAllByGics(String sectorCode, String industryCode) {
        boolean hasSector = sectorCode != null && !sectorCode.isBlank();
        boolean hasIndustry = industryCode != null && !industryCode.isBlank();

        if (hasSector && hasIndustry) {
            return repo.findAllByGicsIndustry_SectorCodeAndGicsIndustry_IndustryCodeOrderBySymbolAsc(
                    sectorCode.trim(), industryCode.trim());
        }
        if (hasSector) {
            return repo.findAllByGicsIndustry_SectorCodeOrderBySymbolAsc(sectorCode.trim());
        }
        if (hasIndustry) {
            return repo.findAllByGicsIndustry_IndustryCodeOrderBySymbolAsc(industryCode.trim());
        }
        return findAll();
    }

    public List<GicsIndustry> findGicsIndustries(String sectorCode) {
        if (sectorCode == null || sectorCode.isBlank()) {
            return gicsIndustries.findAllByOrderByIndustryNameAsc();
        }
        return gicsIndustries.findAllBySectorCodeOrderByIndustryNameAsc(sectorCode.trim());
    }

    public SecurityDetails save(SecurityDetails entity) {
        return repo.save(entity);
    }

    public List<SecurityDetails> saveAll(List<SecurityDetails> entities) {
        return repo.saveAll(entities);
    }
}