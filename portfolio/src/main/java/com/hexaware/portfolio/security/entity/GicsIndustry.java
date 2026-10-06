package com.hexaware.portfolio.security.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "gics_industries")
@Getter
@NoArgsConstructor
public class GicsIndustry {

    @Id
    @Column(name = "industry_code", nullable = false, length = 6, columnDefinition = "char(6)")
    private String industryCode;

    @Column(name = "sector_code", nullable = false, length = 2, columnDefinition = "char(2)")
    private String sectorCode;

    @Column(name = "sector_name", nullable = false, length = 100)
    private String sectorName;

    @Column(name = "industry_name", nullable = false, length = 120)
    private String industryName;
}
