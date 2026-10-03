package com.hexaware.portfolio.portfolio_backend.entity;

import java.util.LinkedHashSet;
import java.util.Set;

import com.hexaware.portfolio.portfolio_backend.entity.enums.InvestmentThemes;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "investment_themes", uniqueConstraints = @UniqueConstraint(columnNames = "theme_code"))
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ThemeDefinition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "theme_code", nullable = false, length = 40)
    private InvestmentThemes theme;

    @Column(nullable = false)
    private String label;

    @Column(nullable = false)
    private String risk;

    @Column(name = "investment_horizon", nullable = false)
    private String investmentHorizon;

    @Column(length = 1000)
    private String description;

    @OneToMany(mappedBy = "theme", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("id ASC")
    @lombok.ToString.Exclude
    @lombok.EqualsAndHashCode.Exclude
    @Builder.Default
    private Set<ThemeAllocation> allocations = new LinkedHashSet<>();

    @OneToMany(mappedBy = "theme", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("id ASC")
    @lombok.ToString.Exclude
    @lombok.EqualsAndHashCode.Exclude
    @Builder.Default
    private Set<ThemeEquityAllocation> equityAllocations = new LinkedHashSet<>();

    public void addAllocation(ThemeAllocation allocation) {
        allocations.add(allocation);
        allocation.setTheme(this);
    }

    public void addEquityAllocation(ThemeEquityAllocation allocation) {
        equityAllocations.add(allocation);
        allocation.setTheme(this);
    }
}