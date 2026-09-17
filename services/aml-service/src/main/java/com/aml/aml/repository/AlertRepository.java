package com.aml.aml.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.aml.aml.entity.Alert;

public interface AlertRepository extends JpaRepository<Alert, Long> {

    List<Alert> findByRiskLevel(String riskLevel);

    List<Alert> findByStatus(String status);

    List<Alert> findByAccountId(String accountId);
}