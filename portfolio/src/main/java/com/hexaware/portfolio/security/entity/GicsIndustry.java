package com.hexaware.portfolio.security.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "gics_industries", indexes = @Index(
    name = "idx_gics_industries_sector", columnList = "sector_code"))
@Getter
@Setter
@NoArgsConstructor
public class GicsIndustry {

    @Id
    @Column(name = "industry_code", nullable = false, length = 6, columnDefinition = "char(6)")
    private String industryCode;

    @Column(name = "industry_name", nullable = false, length = 120)
    private String industryName;

    @Column(name = "sector_code", nullable = false, length = 2, columnDefinition = "char(2)")
    private String sectorCode;

    @Column(name = "sector_name", nullable = false, length = 100)
    private String sectorName;
}