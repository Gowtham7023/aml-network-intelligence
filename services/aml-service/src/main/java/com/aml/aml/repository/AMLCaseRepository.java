package com.aml.aml.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.aml.aml.entity.AMLCase;

public interface AMLCaseRepository extends JpaRepository<AMLCase, Long> {

    List<AMLCase> findByStatus(String status);

    List<AMLCase> findByPriority(String priority);

    List<AMLCase> findByAccountId(String accountId);
}