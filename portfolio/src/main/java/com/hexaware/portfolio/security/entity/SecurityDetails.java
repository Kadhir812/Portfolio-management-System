package com.hexaware.portfolio.security.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Data;

@Entity 
@Data 
@Table(name = "security_details",
	uniqueConstraints = @UniqueConstraint(
		name = "uk_security_exchange_symbol",
		columnNames = {"exchange", "symbol"}
	)
)
public class SecurityDetails {
    
}
