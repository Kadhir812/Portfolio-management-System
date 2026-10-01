package com.hexaware.portfolio.security.entity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "bond_details")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BondDetails {

    @Id
    @Column(name = "security_id")
    private Long securityId;

    @OneToOne(optional = false)
    @MapsId
    @JoinColumn(name = "security_id", referencedColumnName = "security_id",
            nullable = false, foreignKey = @ForeignKey(name = "fk_bond_details_security"))
    private SecurityDetails securityDetails;

    @Column(name = "issuer", length = 200)
    private String issuer;

    @Column(name = "issuer_type", length = 50)
    private String issuerType;

    @Column(name = "bond_name", length = 200)
    private String bondName;

    @Column(name = "bond_type", length = 50)
    private String bondType;

    @Column(name = "face_value", precision = 20, scale = 6)
    private BigDecimal faceValue;

    @Column(name = "issue_price", precision = 20, scale = 6)
    private BigDecimal issuePrice;

    @Column(name = "coupon_rate", precision = 10, scale = 6)
    private BigDecimal couponRate;

    @Column(name = "coupon_type", length = 30)
    private String couponType;

    @Column(name = "coupon_frequency", length = 30)
    private String couponFrequency;

    @Column(name = "issue_date")
    private LocalDate issueDate;

    @Column(name = "maturity_date")
    private LocalDate maturityDate;

    @Column(name = "yield_to_maturity", precision = 10, scale = 6)
    private BigDecimal yieldToMaturity;

    @Column(name = "credit_rating", length = 20)
    private String creditRating;

    @Column(name = "rating_agency", length = 100)
    private String ratingAgency;

    @Column(name = "callable")
    private Boolean callable;

    @Column(name = "puttable")
    private Boolean puttable;

    @Column(name = "minimum_investment", precision = 20, scale = 6)
    private BigDecimal minimumInvestment;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
