package com.hexaware.portfolio.portfolio_backend.repository;

import java.util.Arrays;
import java.util.List;

import org.springframework.stereotype.Repository;

import com.hexaware.portfolio.portfolio_backend.dto.ThemeAllocationResponse;
import com.hexaware.portfolio.portfolio_backend.dto.ThemeDefinitionResponse;
import com.hexaware.portfolio.portfolio_backend.entity.enums.AssetClass;
import com.hexaware.portfolio.portfolio_backend.entity.enums.InvestmentThemes;

@Repository
public class ThemeRepository {

    public List<ThemeDefinitionResponse> findAll() {
        return Arrays.stream(InvestmentThemes.values())
                .map(this::findByTheme)
                .toList();
    }

    public ThemeDefinitionResponse findByTheme(InvestmentThemes theme) {
        return switch (theme) {
            case CONSERVATIVE -> definition(theme, "Conservative", "Moderate", "Medium Term",
                    "A balanced allocation focused on stability and diversified income.",
                    allocation(AssetClass.STOCKS, 15), allocation(AssetClass.MUTUAL_FUNDS, 25),
                    allocation(AssetClass.COMMODITIES, 10), allocation(AssetClass.BONDS, 35),
                    allocation(AssetClass.REITS, 5), allocation(AssetClass.ETFS, 5),
                    allocation(AssetClass.CASH, 5));
            case MODERATELY_CONSERVATIVE -> definition(theme, "Moderately Conservative", "Low", "Short Term",
                    "A lower-risk allocation with a measured equity component.",
                    allocation(AssetClass.STOCKS, 25), allocation(AssetClass.MUTUAL_FUNDS, 25),
                    allocation(AssetClass.COMMODITIES, 10), allocation(AssetClass.BONDS, 25),
                    allocation(AssetClass.REITS, 5), allocation(AssetClass.ETFS, 5),
                    allocation(AssetClass.CASH, 5));
            case AGGRESSIVE -> definition(theme, "Aggressive", "High", "Long Term",
                    "A growth-focused allocation with limited defensive assets.",
                    allocation(AssetClass.STOCKS, 45), allocation(AssetClass.MUTUAL_FUNDS, 15),
                    allocation(AssetClass.COMMODITIES, 5), allocation(AssetClass.BONDS, 10),
                    allocation(AssetClass.CRYPTO, 10), allocation(AssetClass.REITS, 5),
                    allocation(AssetClass.ETFS, 5), allocation(AssetClass.CASH, 5));
            case MODERATELY_AGGRESSIVE -> definition(theme, "Moderately Aggressive", "High", "Long Term",
                    "A high-growth allocation balanced with small defensive positions.",
                    allocation(AssetClass.STOCKS, 55), allocation(AssetClass.MUTUAL_FUNDS, 10),
                    allocation(AssetClass.COMMODITIES, 5), allocation(AssetClass.BONDS, 5),
                    allocation(AssetClass.CRYPTO, 10), allocation(AssetClass.REITS, 5),
                    allocation(AssetClass.ETFS, 5), allocation(AssetClass.CASH, 5));
            case VERY_AGGRESSIVE -> definition(theme, "Very Aggressive", "Very High", "Long Term",
                    "A high-volatility growth allocation for long-term investors.",
                    allocation(AssetClass.STOCKS, 85), allocation(AssetClass.CASH, 5),
                    allocation(AssetClass.BONDS, 10));
        };
    }

    private ThemeDefinitionResponse definition(
            InvestmentThemes theme,
            String label,
            String risk,
            String horizon,
            String description,
            ThemeAllocationResponse... allocations) {
        return new ThemeDefinitionResponse(theme, label, List.of(allocations), risk, horizon, description);
    }

    private ThemeAllocationResponse allocation(AssetClass assetClass, double percentage) {
        return new ThemeAllocationResponse(assetClass, percentage);
    }
}
