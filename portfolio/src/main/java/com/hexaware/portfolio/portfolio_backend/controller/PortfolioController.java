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

import com.hexaware.portfolio.portfolio_backend.dto.CreatePortfolioRequest;
import com.hexaware.portfolio.portfolio_backend.entity.Portfolio;
import com.hexaware.portfolio.portfolio_backend.service.PortfolioService;

import lombok.AllArgsConstructor;

@RestController
@RequestMapping("/api/portfolios")
@AllArgsConstructor
public class PortfolioController {

    private final PortfolioService portfolioService;

    @PostMapping
    public ResponseEntity<Portfolio> create(@RequestBody CreatePortfolioRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                            .body(portfolioService.create(request));
    }

    @GetMapping
    public ResponseEntity<List<Portfolio>> getAll() {
        return ResponseEntity.ok(portfolioService.getAll());
    }

    @GetMapping("/{portfolioId}")
    public ResponseEntity<Portfolio> getById(@PathVariable String portfolioId) {
        return ResponseEntity.ok(portfolioService.getById(portfolioId));
    }

    @PutMapping("/{portfolioId}")
    public ResponseEntity<Portfolio> update(
            @PathVariable String portfolioId,
            @RequestBody CreatePortfolioRequest request) {
        return ResponseEntity.ok(portfolioService.update(portfolioId, request));
    }

    @DeleteMapping("/{portfolioId}")
    public ResponseEntity<Void> delete(@PathVariable String portfolioId) {
        portfolioService.delete(portfolioId);
        return ResponseEntity.noContent().build();
    }
}
