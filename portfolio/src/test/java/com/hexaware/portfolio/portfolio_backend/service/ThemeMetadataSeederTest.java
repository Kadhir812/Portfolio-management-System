package com.hexaware.portfolio.portfolio_backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.EnumMap;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import com.hexaware.portfolio.portfolio_backend.entity.ThemeAllocation;
import com.hexaware.portfolio.portfolio_backend.entity.ThemeDefinition;
import com.hexaware.portfolio.portfolio_backend.entity.enums.AssetClass;
import com.hexaware.portfolio.portfolio_backend.entity.enums.InvestmentThemes;
import com.hexaware.portfolio.portfolio_backend.repository.ThemeRepository;

class ThemeMetadataSeederTest {
    private ThemeRepository repository;
    private ThemeMetadataSeeder seeder;

    @BeforeEach
    void setUp() {
        repository = mock(ThemeRepository.class);
        seeder = new ThemeMetadataSeeder(repository);
    }

    @Test
    void seedsMissingThemesAndSynchronizesExistingAllocations() {
        Map<InvestmentThemes, ThemeDefinition> existing = new EnumMap<>(InvestmentThemes.class);
        ThemeDefinition aggressive = theme(InvestmentThemes.VERY_AGGRESSIVE,
                allocation(AssetClass.STOCKS, "1"), allocation(AssetClass.CRYPTO, "1"));
        ThemeAllocation originalStocks = aggressive.getAllocations().get(0);
        existing.put(InvestmentThemes.VERY_AGGRESSIVE, aggressive);
        when(repository.findByTheme(any())).thenAnswer(invocation -> Optional.ofNullable(
                existing.get(invocation.getArgument(0))));
        when(repository.save(any(ThemeDefinition.class))).thenAnswer(invocation -> invocation.getArgument(0));

        seeder.run();

        ArgumentCaptor<ThemeDefinition> captor = ArgumentCaptor.forClass(ThemeDefinition.class);
        verify(repository, org.mockito.Mockito.times(5)).save(captor.capture());
        assertEquals(5, captor.getAllValues().size());
        assertEquals("Very Aggressive", aggressive.getLabel());
        assertEquals(new BigDecimal("85"), originalStocks.getPercentage());
        assertFalse(aggressive.getAllocations().stream().anyMatch(row -> row.getAssetClass() == AssetClass.CRYPTO
                && row.getPercentage().compareTo(BigDecimal.ONE) == 0));
        assertEquals(3, aggressive.getAllocations().size());
    }

    private ThemeDefinition theme(InvestmentThemes themeCode, ThemeAllocation... allocations) {
        ThemeDefinition theme = new ThemeDefinition();
        theme.setTheme(themeCode);
        for (ThemeAllocation allocation : allocations) theme.addAllocation(allocation);
        return theme;
    }

    private ThemeAllocation allocation(AssetClass assetClass, String percentage) {
        ThemeAllocation allocation = new ThemeAllocation();
        allocation.setAssetClass(assetClass);
        allocation.setPercentage(new BigDecimal(percentage));
        return allocation;
    }
}