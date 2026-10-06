package com.hexaware.portfolio.portfolio_backend.dto;

import java.time.LocalDate;
import java.util.List;

public record PortfolioValuationHistoryRequest(List<LocalDate> dates) {}
