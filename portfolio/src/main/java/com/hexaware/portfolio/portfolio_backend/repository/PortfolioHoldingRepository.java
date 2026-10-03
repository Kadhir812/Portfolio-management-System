package com.hexaware.portfolio.portfolio_backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.hexaware.portfolio.portfolio_backend.entity.PortfolioHolding;

public interface PortfolioHoldingRepository extends JpaRepository<PortfolioHolding, Long> {

    List<PortfolioHolding> findByPortfolioId(Long portfolioId);

    Optional<PortfolioHolding> findByIdAndPortfolioId(Long id, Long portfolioId);

    void deleteByPortfolioId(Long portfolioId);
}