package com.hexaware.portfolio.portfolio_backend.entity;

import java.math.BigDecimal;

import com.hexaware.portfolio.security.entity.EquityCategory;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import org.hibernate.annotations.Check;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "theme_equity_allocations", uniqueConstraints = @UniqueConstraint(
        name = "uk_theme_equity_allocations_theme_category", columnNames = { "theme_id", "equity_category" }))
@Check(name = "ck_theme_equity_allocations_percentage_range", constraints = "percentage >= 0 AND percentage <= 100")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ThemeEquityAllocation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "theme_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_theme_equity_allocations_theme"))
    @lombok.ToString.Exclude
    @lombok.EqualsAndHashCode.Exclude
    private ThemeDefinition theme;

    @Enumerated(EnumType.STRING)
    @Column(name = "equity_category", nullable = false, length = 20)
    private EquityCategory equityCategory;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal percentage;
}