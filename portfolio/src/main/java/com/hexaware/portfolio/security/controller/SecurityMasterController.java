package com.hexaware.portfolio.security.controller;

import java.util.Comparator;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<?> search(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String symbol,
            @RequestParam(required = false) String exchange,
            @RequestParam(required = false) String isin,
            @RequestParam(required = false) String cupid) {
        if (query != null) {
            if (query.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Search query is required");
            }
            return ResponseEntity.ok(securities.search(query.trim()).stream()
                    .map(SecurityMasterResponse::from)
                    .toList());
        }

        boolean hasSymbol = symbol != null && !symbol.isBlank();
        boolean hasExchange = exchange != null && !exchange.isBlank();
        boolean hasIsin = isin != null && !isin.isBlank();
        boolean hasCupid = cupid != null && !cupid.isBlank();

        if (hasSymbol && !hasExchange && !hasIsin && !hasCupid) {
            return ResponseEntity.ok(securities.findFirstBySymbol(symbol.trim())
                .map(SecurityMasterResponse::from)
                .orElseThrow(() -> notFound("No security found for symbol " + symbol.trim())));
        }
        if (!hasSymbol && hasExchange && hasIsin && !hasCupid) {
            return ResponseEntity.ok(securities.findByExchangeAndIsin(exchange.trim(), isin.trim())
                .map(SecurityMasterResponse::from)
                .orElseThrow(() -> notFound("No security found for " + exchange.trim() + " and ISIN")));
        }
        if (!hasSymbol && hasExchange && hasCupid && !hasIsin
            && ("LSE".equalsIgnoreCase(exchange.trim()) || "LSEG".equalsIgnoreCase(exchange.trim()))) {
            return ResponseEntity.ok(securities.findByExchangeAndCupid(exchange.trim(), cupid.trim())
            .map(SecurityMasterResponse::from)
            .orElseThrow(() -> notFound("No security found for LSE and CUPID")));
        }

        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
            "Search by symbol, NSE plus ISIN, or LSE plus CUPID");
    }

    private ResponseStatusException notFound(String message) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, message);
    }
}