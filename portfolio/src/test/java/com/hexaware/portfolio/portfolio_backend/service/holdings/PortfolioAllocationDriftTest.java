package com.hexaware.portfolio.portfolio_backend.service.holdings;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;

class PortfolioAllocationDriftTest {

    @Test
    void driftExactlyAtFivePercentagePointsDoesNotAlert() {
        assertFalse(PortfolioHoldingService.exceedsDriftLimit(new BigDecimal("5.00")));
        assertFalse(PortfolioHoldingService.exceedsDriftLimit(new BigDecimal("-5.00")));
    }

    @Test
    void driftBeyondFivePercentagePointsAlertsInEitherDirection() {
        assertTrue(PortfolioHoldingService.exceedsDriftLimit(new BigDecimal("5.01")));
        assertTrue(PortfolioHoldingService.exceedsDriftLimit(new BigDecimal("-5.01")));
    }
}