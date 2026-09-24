package com.hexaware.portfolio.security.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.hexaware.portfolio.security.entity.SecurityDetails;
import com.hexaware.portfolio.security.repository.SecurityDetailsRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SecurityDetailsService {

    private final SecurityDetailsRepository repo;

    public Optional<SecurityDetails> getByIsin(String isin) {
        return repo.findByIsin(isin);
    }

    public Optional<SecurityDetails> getBySymbol(String symbol) {
        return repo.findBySymbol(symbol);
    }

    public Optional<SecurityDetails> getBySymbolAndSeries(String symbol, String series) {
        return repo.findBySymbolAndSeries(symbol, series);
    }

    public List<SecurityDetails> findAll() {
        return repo.findAll();
    }

    public SecurityDetails save(SecurityDetails entity) {
        return repo.save(entity);
    }

    public List<SecurityDetails> saveAll(List<SecurityDetails> entities) {
        return repo.saveAll(entities);
    }
}