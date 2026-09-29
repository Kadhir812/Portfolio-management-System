package com.hexaware.portfolio.portfolio_backend.repository;

import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.hexaware.portfolio.portfolio_backend.entity.PortfolioTrade;

public interface PortfolioTradeRepository extends JpaRepository<PortfolioTrade, Long> {
    List<PortfolioTrade> findByPortfolioIdAndTradeDateLessThanEqualOrderByTradeDateAscIdAsc(Long portfolioId, LocalDate date);
    List<PortfolioTrade> findAllByPortfolioId(Long portfolioId);
    boolean existsByPortfolioId(Long portfolioId);
}
