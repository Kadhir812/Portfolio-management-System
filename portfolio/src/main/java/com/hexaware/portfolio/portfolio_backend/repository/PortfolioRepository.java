package com.hexaware.portfolio.portfolio_backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.hexaware.portfolio.portfolio_backend.entity.Portfolio;

public interface PortfolioRepository extends JpaRepository<Portfolio, String> {

	Optional<Portfolio> findById(String id);
}