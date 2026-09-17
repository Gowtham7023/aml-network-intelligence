package com.aml.aml.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.aml.aml.dto.AMLResult;
import com.aml.aml.dto.TransactionData;
import com.aml.aml.entity.Alert;
import com.aml.aml.repository.AlertRepository;
import com.aml.aml.service.AMLService;

@RestController
@RequestMapping("/api/aml")
public class AMLController {

    private final AMLService amlService;
    private final AlertRepository alertRepository;

    public AMLController(AMLService amlService,
                         AlertRepository alertRepository) {
        this.amlService = amlService;
        this.alertRepository = alertRepository;
    }

    @PostMapping("/analyze")
    public AMLResult analyzeTransaction(
            @RequestBody TransactionData transaction) {

        return amlService.analyze(transaction);
    }

    @GetMapping("/alerts")
    public List<Alert> getAllAlerts() {
        return alertRepository.findAll();
    }

    @GetMapping("/alerts/high")
    public List<Alert> getHighRiskAlerts() {
        return alertRepository.findByRiskLevel("HIGH");
    }

    @GetMapping("/alerts/open")
    public List<Alert> getOpenAlerts() {
        return alertRepository.findByStatus("OPEN");
    }

    @GetMapping("/alerts/account/{accountId}")
    public List<Alert> getAccountAlerts(
            @PathVariable String accountId) {

        return alertRepository.findByAccountId(accountId);
    }
}