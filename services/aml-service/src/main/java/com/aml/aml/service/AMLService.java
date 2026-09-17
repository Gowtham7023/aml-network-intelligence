package com.aml.aml.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.aml.aml.dto.AMLResult;
import com.aml.aml.dto.TransactionData;
import com.aml.aml.entity.Alert;
import com.aml.aml.repository.AlertRepository;

@Service
public class AMLService {

    private final List<AMLRule> rules;
    private final AlertRepository alertRepository;

    public AMLService(List<AMLRule> rules,
                      AlertRepository alertRepository) {
        this.rules = rules;
        this.alertRepository = alertRepository;
    }

    public AMLResult analyze(TransactionData transaction) {

        double riskScore = 0;
        List<String> alerts = new ArrayList<>();

        for (AMLRule rule : rules) {

            if (rule.matches(transaction)) {

                riskScore += rule.getRiskScore();
                alerts.add(rule.getAlertType());

                Alert alert = new Alert();

                alert.setTransactionId(transaction.getTransactionId());
                alert.setAccountId(transaction.getFromAccountId());
                alert.setRiskScore(rule.getRiskScore());
                alert.setRiskLevel("ALERT");
                alert.setAlertType(rule.getAlertType());
                alert.setDescription(rule.getDescription());
                alert.setStatus("OPEN");
                alert.setCreatedAt(LocalDateTime.now());

                alertRepository.save(alert);
            }
        }

        riskScore = Math.min(riskScore, 100);

        String riskLevel;

        if (riskScore >= 70) {
            riskLevel = "HIGH";
        } else if (riskScore >= 40) {
            riskLevel = "MEDIUM";
        } else {
            riskLevel = "LOW";
        }

        boolean flagged = riskScore >= 40;

        return new AMLResult(
                riskScore,
                riskLevel,
                flagged,
                alerts
        );
    }
}