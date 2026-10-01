package com.hexaware.portfolio.security.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.hexaware.portfolio.security.entity.AssetClassMaster;

public interface AssetClassMasterRepository extends JpaRepository<AssetClassMaster, Long> {

    List<AssetClassMaster> findAllByOrderByAssetClassAscSubAssetClassAsc();
}