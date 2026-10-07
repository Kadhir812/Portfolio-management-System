package com.hexaware.portfolio.security.controller;

import java.util.Comparator;
import java.util.List;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.hexaware.portfolio.security.dto.SecurityMasterResponse;
import com.hexaware.portfolio.security.service.SecurityDetailsService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/securities")
@RequiredArgsConstructor
public class SecurityMasterController {
    private final SecurityDetailsService securities;

    @GetMapping
    @Cacheable(cacheNames = "security-master", key = "'all'")
    public List<SecurityMasterResponse> list() {
        return securities.findAll().stream()
                .map(SecurityMasterResponse::from)
                .sorted(Comparator.comparing((SecurityMasterResponse s) -> normalizeExchange(s.exchange()), String.CASE_INSENSITIVE_ORDER)
                        .thenComparing((SecurityMasterResponse s) -> normalizeText(s.symbol()), String.CASE_INSENSITIVE_ORDER)
                        .thenComparing((SecurityMasterResponse s) -> normalizeText(s.name()), String.CASE_INSENSITIVE_ORDER)
                        .thenComparing(SecurityMasterResponse::securityId, Comparator.nullsLast(Long::compareTo)))
                .toList();
    }

    private String normalizeExchange(String exchange) {
        if (exchange == null || exchange.isBlank()) {
            return "ZZZ";
        }
        return exchange.trim();
    }

    private String normalizeText(String value) {
        if (value == null) {
            return "";
        }
        return value.trim();
    }

    @GetMapping("/search")
    public SecurityMasterResponse search(
            @RequestParam(required = false) String symbol,
            @RequestParam(required = false) String exchange,
            @RequestParam(required = false) String isin) {
        boolean hasSymbol = symbol != null && !symbol.isBlank();
        boolean hasExchange = exchange != null && !exchange.isBlank();
        boolean hasIsin = isin != null && !isin.isBlank();

        if (hasSymbol && !hasExchange && !hasIsin) {
            return securities.findFirstBySymbol(symbol.trim())
                    .map(SecurityMasterResponse::from)
                    .orElseThrow(() -> notFound("No security found for symbol " + symbol.trim()));
        }
        if (!hasSymbol && hasExchange && hasIsin) {
            return securities.findByExchangeAndIsin(exchange.trim(), isin.trim())
                    .map(SecurityMasterResponse::from)
                    .orElseThrow(() -> notFound("No security found for exchange and ISIN"));
        }

        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Search using either symbol, or both exchange and ISIN");
    }

    private ResponseStatusException notFound(String message) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, message);
    }
}