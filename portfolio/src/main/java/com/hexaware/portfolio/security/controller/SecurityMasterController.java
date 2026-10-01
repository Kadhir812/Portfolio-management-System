package com.hexaware.portfolio.security.controller;

import java.util.Comparator;
import java.util.List;

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
    public List<SecurityMasterResponse> list(
            @RequestParam(required = false) String sectorCode,
            @RequestParam(required = false) String industryCode) {
        return securities.findAllByGics(sectorCode, industryCode).stream()
                .map(SecurityMasterResponse::from)
                .sorted(Comparator.comparing(SecurityMasterResponse::exchange,
                                Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER))
                        .thenComparing(SecurityMasterResponse::symbol,
                                Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)))
                .toList();
    }

    @GetMapping("/search")
    public SecurityMasterResponse search(
            @RequestParam(required = false) String symbol,
            @RequestParam(required = false) String exchange,
            @RequestParam(required = false) String isin,
            @RequestParam(required = false) String cupid) {
        boolean hasSymbol = symbol != null && !symbol.isBlank();
        boolean hasExchange = exchange != null && !exchange.isBlank();
        boolean hasIsin = isin != null && !isin.isBlank();
        boolean hasCupid = cupid != null && !cupid.isBlank();

        if (hasSymbol && !hasExchange && !hasIsin && !hasCupid) {
            return securities.findFirstBySymbol(symbol.trim())
                    .map(SecurityMasterResponse::from)
                    .orElseThrow(() -> notFound("No security found for symbol " + symbol.trim()));
        }
        if (!hasSymbol && hasExchange && hasIsin && !hasCupid
            && "NSE".equalsIgnoreCase(exchange.trim())) {
            return securities.findByExchangeAndIsin(exchange.trim(), isin.trim())
                    .map(SecurityMasterResponse::from)
                .orElseThrow(() -> notFound("No security found for NSE and ISIN"));
        }
        if (!hasSymbol && hasExchange && hasCupid && !hasIsin
            && ("LSE".equalsIgnoreCase(exchange.trim()) || "LSEG".equalsIgnoreCase(exchange.trim()))) {
            return securities.findByExchangeAndCupid(exchange.trim(), cupid.trim())
                .map(SecurityMasterResponse::from)
                .orElseThrow(() -> notFound("No security found for LSE and CUPID"));
        }

        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
            "Search by symbol, NSE plus ISIN, or LSE plus CUPID");
    }

    private ResponseStatusException notFound(String message) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, message);
    }
}