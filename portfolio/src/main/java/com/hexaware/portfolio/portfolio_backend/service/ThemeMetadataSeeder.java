package com.hexaware.portfolio.portfolio_backend.service;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import com.hexaware.portfolio.portfolio_backend.entity.ThemeAllocation;
import com.hexaware.portfolio.portfolio_backend.entity.ThemeDefinition;
import com.hexaware.portfolio.portfolio_backend.entity.ThemeEquityAllocation;
import com.hexaware.portfolio.portfolio_backend.entity.enums.AssetClass;
import com.hexaware.portfolio.portfolio_backend.entity.enums.InvestmentThemes;
import com.hexaware.portfolio.portfolio_backend.repository.ThemeRepository;
import com.hexaware.portfolio.security.entity.EquityCategory;

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
                        for (ThemeEquityAllocation allocation : defaults.getEquityAllocations()) {
                                boolean alreadyExists = theme.getEquityAllocations().stream()
                                                .anyMatch(existing -> existing.getEquityCategory() == allocation.getEquityCategory());
                                if (!alreadyExists) {
                                        theme.addEquityAllocation(ThemeEquityAllocation.builder()
                                                        .equityCategory(allocation.getEquityCategory())
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
                        allocation(AssetClass.EQUITY, 15), allocation(AssetClass.MUTUAL_FUNDS, 25),
                        allocation(AssetClass.COMMODITIES, 10), allocation(AssetClass.BONDS, 35),
                        allocation(AssetClass.REITS, 5), allocation(AssetClass.ETFS, 5), allocation(AssetClass.CASH, 5)),
                theme(InvestmentThemes.MODERATELY_CONSERVATIVE, "Moderately Conservative", "Low", "Short Term",
                        "A lower-risk allocation with a measured equity component.",
                        allocation(AssetClass.EQUITY, 25), allocation(AssetClass.MUTUAL_FUNDS, 25),
                        allocation(AssetClass.COMMODITIES, 10), allocation(AssetClass.BONDS, 25),
                        allocation(AssetClass.REITS, 5), allocation(AssetClass.ETFS, 5), allocation(AssetClass.CASH, 5)),
                theme(InvestmentThemes.AGGRESSIVE, "Aggressive", "High", "Long Term",
                        "A growth-focused allocation with limited defensive assets.",
                        allocation(AssetClass.EQUITY, 45), allocation(AssetClass.MUTUAL_FUNDS, 15),
                        allocation(AssetClass.COMMODITIES, 5), allocation(AssetClass.BONDS, 10),
                        allocation(AssetClass.CRYPTO, 10), allocation(AssetClass.REITS, 5),
                        allocation(AssetClass.ETFS, 5), allocation(AssetClass.CASH, 5)),
                theme(InvestmentThemes.MODERATELY_AGGRESSIVE, "Moderately Aggressive", "High", "Long Term",
                        "A high-growth allocation balanced with small defensive positions.",
                        allocation(AssetClass.EQUITY, 55), allocation(AssetClass.MUTUAL_FUNDS, 10),
                        allocation(AssetClass.COMMODITIES, 5), allocation(AssetClass.BONDS, 5),
                        allocation(AssetClass.CRYPTO, 10), allocation(AssetClass.REITS, 5),
                        allocation(AssetClass.ETFS, 5), allocation(AssetClass.CASH, 5)),
                theme(InvestmentThemes.VERY_AGGRESSIVE, "Very Aggressive", "Very High", "Long Term",
                        "A high-volatility growth allocation for long-term investors.",
                        allocation(AssetClass.EQUITY, 85), allocation(AssetClass.CASH, 5), allocation(AssetClass.BONDS, 10)));
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
                for (ThemeEquityAllocation allocation : equityAllocations(code)) {
                        theme.addEquityAllocation(allocation);
                }
        return theme;
    }

        private List<ThemeEquityAllocation> equityAllocations(InvestmentThemes theme) {
                return switch (theme) {
                        case CONSERVATIVE -> List.of(
                                        equityAllocation(EquityCategory.LARGE_CAP, 10),
                                        equityAllocation(EquityCategory.MID_CAP, 4),
                                        equityAllocation(EquityCategory.SMALL_CAP, 1));
                        case MODERATELY_CONSERVATIVE -> List.of(
                                        equityAllocation(EquityCategory.LARGE_CAP, 15),
                                        equityAllocation(EquityCategory.MID_CAP, 7),
                                        equityAllocation(EquityCategory.SMALL_CAP, 3));
                        case AGGRESSIVE -> List.of(
                                        equityAllocation(EquityCategory.LARGE_CAP, 25),
                                        equityAllocation(EquityCategory.MID_CAP, 13),
                                        equityAllocation(EquityCategory.SMALL_CAP, 7));
                        case MODERATELY_AGGRESSIVE -> List.of(
                                        equityAllocation(EquityCategory.LARGE_CAP, 25),
                                        equityAllocation(EquityCategory.MID_CAP, 18),
                                        equityAllocation(EquityCategory.SMALL_CAP, 12));
                        case VERY_AGGRESSIVE -> List.of(
                                        equityAllocation(EquityCategory.LARGE_CAP, 30),
                                        equityAllocation(EquityCategory.MID_CAP, 30),
                                        equityAllocation(EquityCategory.SMALL_CAP, 25));
                };
        }

        private ThemeEquityAllocation equityAllocation(EquityCategory category, int percentage) {
                return ThemeEquityAllocation.builder()
                                .equityCategory(category)
                                .percentage(BigDecimal.valueOf(percentage))
                                .build();
        }

    private ThemeAllocation allocation(AssetClass assetClass, int percentage) {
        return ThemeAllocation.builder()
                .assetClass(assetClass)
                .percentage(BigDecimal.valueOf(percentage))
                .build();
    }
}