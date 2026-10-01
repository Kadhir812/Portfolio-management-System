package com.hexaware.portfolio.security.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.hexaware.portfolio.security.entity.GicsIndustry;

public interface GicsIndustryRepository extends JpaRepository<GicsIndustry, String> {

    List<GicsIndustry> findAllByOrderBySectorNameAscIndustryNameAsc();

    List<GicsIndustry> findAllBySectorCodeOrderByIndustryNameAsc(String sectorCode);

    List<GicsIndustry> findAllByOrderByIndustryNameAsc();
}