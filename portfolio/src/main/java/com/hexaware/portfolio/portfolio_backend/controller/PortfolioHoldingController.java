package com.hexaware.portfolio.portfolio_backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hexaware.portfolio.portfolio_backend.dto.AddSecurityRequest;
import com.hexaware.portfolio.portfolio_backend.dto.EligibleSecurityResponse;
import com.hexaware.portfolio.portfolio_backend.dto.PortfolioHoldingSummaryResponse;
import com.hexaware.portfolio.portfolio_backend.dto.UpdateHoldingRequest;
import com.hexaware.portfolio.portfolio_backend.entity.Portfolio;
import com.hexaware.portfolio.portfolio_backend.entity.PortfolioHolding;
import com.hexaware.portfolio.portfolio_backend.service.PortfolioHoldingService;

@RestController
@RequestMapping("/api/portfolios/{portfolioId}/holdings")
public class PortfolioHoldingController {

    private final PortfolioHoldingService holdingService;

    public PortfolioHoldingController(PortfolioHoldingService holdingService) {
        this.holdingService = holdingService;
    }

    @PostMapping
    public ResponseEntity<PortfolioHolding> addSecurity(
            @PathVariable String portfolioId,
            @RequestBody AddSecurityRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(holdingService.addSecurity(portfolioId, request));
    }

    @PostMapping("/save")
    public ResponseEntity<Portfolio> saveHoldings(
            @PathVariable String portfolioId) {
        return ResponseEntity.ok(holdingService.saveHoldings(portfolioId));
    }

    @GetMapping
    public ResponseEntity<List<PortfolioHolding>> getAll(@PathVariable String portfolioId) {
        return ResponseEntity.ok(holdingService.getAll(portfolioId));
    }

    @GetMapping("/summary")
    public ResponseEntity<PortfolioHoldingSummaryResponse> getSummary(@PathVariable String portfolioId) {
        return ResponseEntity.ok(holdingService.getSummary(portfolioId));
    }

    @GetMapping("/eligible-securities")
    public ResponseEntity<List<EligibleSecurityResponse>> getEligibleSecurities(
            @PathVariable String portfolioId) {
        return ResponseEntity.ok(holdingService.getEligibleSecurities(portfolioId));
    }

    @GetMapping("/{holdingId}")
    public ResponseEntity<PortfolioHolding> getById(
            @PathVariable String portfolioId,
            @PathVariable Long holdingId) {
        return ResponseEntity.ok(holdingService.getById(portfolioId, holdingId));
    }

    @PutMapping("/{holdingId}")
    public ResponseEntity<PortfolioHolding> update(
            @PathVariable String portfolioId,
            @PathVariable Long holdingId,
            @RequestBody UpdateHoldingRequest request) {
        return ResponseEntity.ok(holdingService.update(portfolioId, holdingId, request));
    }

    @DeleteMapping("/{holdingId}")
    public ResponseEntity<Void> delete(
            @PathVariable String portfolioId,
            @PathVariable Long holdingId) {
        holdingService.delete(portfolioId, holdingId);
        return ResponseEntity.noContent().build();
    }
}
