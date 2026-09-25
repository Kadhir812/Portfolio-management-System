package com.hexaware.portfolio.portfolio_backend.entity;

import java.util.List;

import com.hexaware.portfolio.portfolio_backend.entity.enums.InvestmentThemes;

import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ThemeDefininition {

    @Enumerated(EnumType.STRING)
    private InvestmentThemes theme;               // unique key

    private String label;                        // radio-button display text

    private List<AsssetAllocation> alloccation;  // predefind conditions

    private String description;
}