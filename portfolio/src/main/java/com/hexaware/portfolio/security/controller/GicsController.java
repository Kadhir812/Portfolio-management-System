package com.hexaware.portfolio.security.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.hexaware.portfolio.security.dto.GicsIndustryResponse;
import com.hexaware.portfolio.security.dto.GicsSectorResponse;
import com.hexaware.portfolio.security.service.GicsService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/gics")
@RequiredArgsConstructor
public class GicsController {
    private final GicsService gics;

    @GetMapping("/sectors")
    public List<GicsSectorResponse> sectors() {
        return gics.getSectors();
    }

    @GetMapping("/industries")
    public List<GicsIndustryResponse> industries(
            @RequestParam(required = false) String sectorCode) {
        return gics.getIndustries(sectorCode);
    }
}