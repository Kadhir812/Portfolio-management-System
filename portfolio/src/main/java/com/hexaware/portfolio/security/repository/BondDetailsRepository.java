package com.hexaware.portfolio.security.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.hexaware.portfolio.security.entity.BondDetails;

public interface BondDetailsRepository extends JpaRepository<BondDetails, Long> {
}
