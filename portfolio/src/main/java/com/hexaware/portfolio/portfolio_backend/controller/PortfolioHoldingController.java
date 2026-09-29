package com.hexaware.portfolio.portfolio_backend.controller;

import java.util.List;
import java.time.LocalDate;

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
import com.hexaware.portfolio.portfolio_backend.dto.PortfolioValuationResponse;
import com.hexaware.portfolio.portfolio_backend.dto.RebalanceRequest;
import com.hexaware.portfolio.portfolio_backend.entity.Portfolio;
import com.hexaware.portfolio.portfolio_backend.entity.PortfolioHolding;
import com.hexaware.portfolio.portfolio_backend.service.holdings.PortfolioHoldingService;

@RestController
@RequestMapping("/api/portfolios/{portfolioId}/holdings")
public class PortfolioHoldingController {

    private final PortfolioHoldingService holdingService;

    public PortfolioHoldingController(PortfolioHoldingService holdingService) {
        this.holdingService = holdingService;
    }

    @PostMapping
    public ResponseEntity<PortfolioHolding> addSecurity(
            @PathVariable Long portfolioId,
            @RequestBody AddSecurityRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(holdingService.addSecurity(portfolioId, request));
    }

    @PostMapping("/save")
    public ResponseEntity<Portfolio> saveHoldings(
            @PathVariable Long portfolioId) {
        return ResponseEntity.ok(holdingService.saveHoldings(portfolioId));
    }

    @GetMapping
    public ResponseEntity<List<PortfolioHolding>> getAll(@PathVariable Long portfolioId) {
        return ResponseEntity.ok(holdingService.getAll(portfolioId));
    }

    @GetMapping("/summary")
    public ResponseEntity<PortfolioHoldingSummaryResponse> getSummary(@PathVariable Long portfolioId) {
        return ResponseEntity.ok(holdingService.getSummary(portfolioId));
    }

    @GetMapping("/valuation")
    public ResponseEntity<PortfolioValuationResponse> getValuation(
            @PathVariable Long portfolioId,
            @org.springframework.web.bind.annotation.RequestParam(required = false) LocalDate date) {
        return ResponseEntity.ok(holdingService.getValuation(portfolioId, date));
    }

    @PostMapping("/rebalance")
    public ResponseEntity<Void> rebalance(@PathVariable Long portfolioId, @RequestBody RebalanceRequest request) {
        holdingService.rebalance(portfolioId, request);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/eligible-securities")
    public ResponseEntity<List<EligibleSecurityResponse>> getEligibleSecurities(
            @PathVariable Long portfolioId,
            @org.springframework.web.bind.annotation.RequestParam(required = false) LocalDate date) {
        return ResponseEntity.ok(holdingService.getEligibleSecurities(portfolioId, date));
    }

    @GetMapping("/{holdingId}")
    public ResponseEntity<PortfolioHolding> getById(
            @PathVariable Long portfolioId,
            @PathVariable Long holdingId) {
        return ResponseEntity.ok(holdingService.getById(portfolioId, holdingId));
    }

    @PutMapping("/{holdingId}")
    public ResponseEntity<PortfolioHolding> update(
            @PathVariable Long portfolioId,
            @PathVariable Long holdingId,
            @RequestBody UpdateHoldingRequest request) {
        return ResponseEntity.ok(holdingService.update(portfolioId, holdingId, request));
    }

    @DeleteMapping("/{holdingId}")
    public ResponseEntity<Void> delete(
            @PathVariable Long portfolioId,
            @PathVariable Long holdingId) {
        holdingService.delete(portfolioId, holdingId);
        return ResponseEntity.noContent().build();
    }
}
