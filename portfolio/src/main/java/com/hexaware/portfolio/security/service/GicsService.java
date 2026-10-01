package com.hexaware.portfolio.security.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.hexaware.portfolio.security.dto.GicsIndustryResponse;
import com.hexaware.portfolio.security.dto.GicsSectorResponse;
import com.hexaware.portfolio.security.entity.GicsIndustry;
import com.hexaware.portfolio.security.repository.GicsIndustryRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class GicsService {
    private final GicsIndustryRepository industries;

    public List<GicsSectorResponse> getSectors() {
        Map<String, GicsSectorResponse> sectors = new LinkedHashMap<>();

        for (GicsIndustry industry : industries.findAllByOrderBySectorNameAscIndustryNameAsc()) {
            sectors.putIfAbsent(
                    industry.getSectorCode(),
                    new GicsSectorResponse(industry.getSectorCode(), industry.getSectorName()));
        }

        return new ArrayList<>(sectors.values());
    }

    public List<GicsIndustryResponse> getIndustries(String sectorCode) {
        List<GicsIndustry> matches = sectorCode == null || sectorCode.isBlank()
                ? industries.findAllByOrderByIndustryNameAsc()
                : industries.findAllBySectorCodeOrderByIndustryNameAsc(sectorCode.trim());

        return matches.stream()
                .map(industry -> new GicsIndustryResponse(
                        industry.getIndustryCode(),
                        industry.getIndustryName(),
                        industry.getSectorCode(),
                        industry.getSectorName()))
                .toList();
    }
}