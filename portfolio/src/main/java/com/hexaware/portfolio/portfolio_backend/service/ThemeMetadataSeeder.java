package com.hexaware.portfolio.portfolio_backend.service;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import com.hexaware.portfolio.portfolio_backend.entity.ThemeAllocation;
import com.hexaware.portfolio.portfolio_backend.entity.ThemeDefinition;
import com.hexaware.portfolio.portfolio_backend.entity.enums.AssetClass;
import com.hexaware.portfolio.portfolio_backend.entity.enums.InvestmentThemes;
import com.hexaware.portfolio.portfolio_backend.repository.ThemeRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class ThemeMetadataSeeder implements CommandLineRunner {

    private final ThemeRepository themeRepository;

    @Override
    public void run(String... args) {
        for (ThemeDefinition defaults : defaults()) {
            ThemeDefinition theme = themeRepository.findByTheme(defaults.getTheme())
                    .orElseGet(() -> themeRepository.save(defaults));

            for (ThemeAllocation allocation : defaults.getAllocations()) {
                boolean alreadyExists = theme.getAllocations().stream()
                        .anyMatch(existing -> existing.getAssetClass() == allocation.getAssetClass());
                if (!alreadyExists) {
                    theme.addAllocation(ThemeAllocation.builder()
                            .assetClass(allocation.getAssetClass())
                            .percentage(allocation.getPercentage())
                            .build());
                }
            }
            themeRepository.save(theme);
        }
    }

    private List<ThemeDefinition> defaults() {
        return List.of(
                theme(InvestmentThemes.CONSERVATIVE, "Conservative", "Moderate", "Medium Term",
                        "A balanced allocation focused on stability and diversified income.",
                        allocation(AssetClass.STOCKS, 15), allocation(AssetClass.MUTUAL_FUNDS, 25),
                        allocation(AssetClass.COMMODITIES, 10), allocation(AssetClass.BONDS, 35),
                        allocation(AssetClass.REITS, 5), allocation(AssetClass.ETFS, 5), allocation(AssetClass.CASH, 5)),
                theme(InvestmentThemes.MODERATELY_CONSERVATIVE, "Moderately Conservative", "Low", "Short Term",
                        "A lower-risk allocation with a measured equity component.",
                        allocation(AssetClass.STOCKS, 25), allocation(AssetClass.MUTUAL_FUNDS, 25),
                        allocation(AssetClass.COMMODITIES, 10), allocation(AssetClass.BONDS, 25),
                        allocation(AssetClass.REITS, 5), allocation(AssetClass.ETFS, 5), allocation(AssetClass.CASH, 5)),
                theme(InvestmentThemes.AGGRESSIVE, "Aggressive", "High", "Long Term",
                        "A growth-focused allocation with limited defensive assets.",
                        allocation(AssetClass.STOCKS, 45), allocation(AssetClass.MUTUAL_FUNDS, 15),
                        allocation(AssetClass.COMMODITIES, 5), allocation(AssetClass.BONDS, 10),
                        allocation(AssetClass.CRYPTO, 10), allocation(AssetClass.REITS, 5),
                        allocation(AssetClass.ETFS, 5), allocation(AssetClass.CASH, 5)),
                theme(InvestmentThemes.MODERATELY_AGGRESSIVE, "Moderately Aggressive", "High", "Long Term",
                        "A high-growth allocation balanced with small defensive positions.",
                        allocation(AssetClass.STOCKS, 55), allocation(AssetClass.MUTUAL_FUNDS, 10),
                        allocation(AssetClass.COMMODITIES, 5), allocation(AssetClass.BONDS, 5),
                        allocation(AssetClass.CRYPTO, 10), allocation(AssetClass.REITS, 5),
                        allocation(AssetClass.ETFS, 5), allocation(AssetClass.CASH, 5)),
                theme(InvestmentThemes.VERY_AGGRESSIVE, "Very Aggressive", "Very High", "Long Term",
                        "A high-volatility growth allocation for long-term investors.",
                        allocation(AssetClass.STOCKS, 85), allocation(AssetClass.CASH, 5), allocation(AssetClass.BONDS, 10)));
    }

    private ThemeDefinition theme(InvestmentThemes code, String label, String risk, String horizon,
            String description, ThemeAllocation... allocations) {
        ThemeDefinition theme = ThemeDefinition.builder()
                .theme(code)
                .label(label)
                .risk(risk)
                .investmentHorizon(horizon)
                .description(description)
                .build();
        for (ThemeAllocation allocation : allocations) {
            theme.addAllocation(allocation);
        }
        return theme;
    }

    private ThemeAllocation allocation(AssetClass assetClass, int percentage) {
        return ThemeAllocation.builder()
                .assetClass(assetClass)
                .percentage(BigDecimal.valueOf(percentage))
                .build();
    }
}