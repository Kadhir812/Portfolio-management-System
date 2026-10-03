package com.hexaware.portfolio.portfolio_backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.hexaware.portfolio.portfolio_backend.entity.ThemeDefinition;
import com.hexaware.portfolio.portfolio_backend.entity.enums.InvestmentThemes;

public interface ThemeRepository extends JpaRepository<ThemeDefinition, Long> {
        @EntityGraph(attributePaths = { "allocations", "equityAllocations" })
        Optional<ThemeDefinition> findByTheme(InvestmentThemes theme);

        @EntityGraph(attributePaths = { "allocations", "equityAllocations" })
        List<ThemeDefinition> findAllByOrderByIdAsc();
}
