package com.aml.aml.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import com.aml.aml.dto.AMLResult;
import com.aml.aml.dto.NetworkAnalysisResponse;
import com.aml.aml.dto.NetworkRiskData;
import com.aml.aml.dto.TransactionData;
import com.aml.aml.entity.AMLCase;
import com.aml.aml.entity.Alert;
import com.aml.aml.repository.AMLCaseRepository;
import com.aml.aml.repository.AlertRepository;

@Service
public class AMLService {

    private static final Logger log = LoggerFactory.getLogger(AMLService.class);

    private final List<AMLRule> rules;
    private final AlertRepository alertRepository;
    private final AMLCaseRepository caseRepository;
    private final NetworkAnalysisClient networkAnalysisClient;
    private final RestClient transactionRestClient;

    public AMLService(
            List<AMLRule> rules,
            AlertRepository alertRepository,
            AMLCaseRepository caseRepository,
            NetworkAnalysisClient networkAnalysisClient,
            @Value("${transaction.service.url:http://localhost:8081}") String transactionServiceUrl) {
        this.rules = rules;
        this.alertRepository = alertRepository;
        this.caseRepository = caseRepository;
        this.networkAnalysisClient = networkAnalysisClient;
        this.transactionRestClient = RestClient.builder().baseUrl(transactionServiceUrl).build();
    }

    public AMLResult analyze(TransactionData transaction) {
        double ruleRiskScore = 0.0;
        List<String> ruleAlerts = new ArrayList<>();
        List<String> reasons = new ArrayList<>();

        // 1. Transaction-level AML Rules evaluation
        for (AMLRule rule : rules) {
            if (rule.matches(transaction)) {
                ruleRiskScore += rule.getRiskScore();
                ruleAlerts.add(rule.getAlertType());
                reasons.add(rule.getDescription());
            }
        }
        ruleRiskScore = Math.min(ruleRiskScore, 100.0);

        // 2. Fetch transaction context & call Network Analysis Service
        List<TransactionData> networkTransactions = fetchNetworkTransactionContext(transaction);
        NetworkAnalysisResponse networkResponse = networkAnalysisClient.analyzeNetwork(networkTransactions);

        NetworkRiskData networkRisk = networkResponse.getRisk();
        double networkRiskScore = (networkRisk != null && networkRisk.getRiskScore() != null)
                ? networkRisk.getRiskScore()
                : 0.0;
        List<String> networkPatterns = (networkRisk != null && networkRisk.getDetectedPatterns() != null)
                ? networkRisk.getDetectedPatterns()
                : new ArrayList<>();

        if (networkRisk != null && networkRisk.getReasons() != null) {
            for (String reason : networkRisk.getReasons()) {
                if (!reasons.contains(reason)) {
                    reasons.add(reason);
                }
            }
        }

        // 3. Combine Risk Scores (Rules + Network Topology)
        double combinedRiskScore;
        if (ruleRiskScore > 0 && networkRiskScore > 0) {
            combinedRiskScore = Math.min(100.0, Math.max(ruleRiskScore, (ruleRiskScore * 0.4) + (networkRiskScore * 0.6)));
        } else if (ruleRiskScore > 0) {
            combinedRiskScore = ruleRiskScore;
        } else if (networkRiskScore > 0) {
            combinedRiskScore = networkRiskScore;
        } else {
            combinedRiskScore = 0.0;
        }

        // Ensure high-risk network patterns escalate overall risk score
        if (networkPatterns.contains("CIRCULAR_TRANSACTIONS") || networkPatterns.contains("LAYERING_CHAIN")) {
            combinedRiskScore = Math.max(combinedRiskScore, 75.0);
        }

        combinedRiskScore = Math.min(100.0, Math.round(combinedRiskScore * 100.0) / 100.0);

        // 4. Determine combined risk level
        String riskLevel;
        if (combinedRiskScore >= 70.0) {
            riskLevel = "HIGH";
        } else if (combinedRiskScore >= 40.0) {
            riskLevel = "MEDIUM";
        } else {
            riskLevel = "LOW";
        }

        boolean flagged = combinedRiskScore >= 40.0;

        // 5. Combine all alert types
        List<String> allAlerts = new ArrayList<>(ruleAlerts);
        for (String pattern : networkPatterns) {
            if (!allAlerts.contains(pattern)) {
                allAlerts.add(pattern);
            }
        }

        // 6. Persist Alerts & automatically escalate High-Risk cases
        if (flagged) {
            if (!ruleAlerts.isEmpty()) {
                for (AMLRule rule : rules) {
                    if (rule.matches(transaction)) {
                        Alert alert = new Alert();
                        alert.setTransactionId(transaction.getTransactionId());
                        alert.setAccountId(transaction.getFromAccountId());
                        alert.setRiskScore(combinedRiskScore);
                        alert.setRiskLevel(riskLevel);
                        alert.setAlertType(rule.getAlertType());

                        String description = rule.getDescription();
                        if (!networkPatterns.isEmpty()) {
                            description += " | Network patterns: " + String.join(", ", networkPatterns);
                        }
                        alert.setDescription(description);
                        alert.setStatus("OPEN");
                        alert.setCreatedAt(LocalDateTime.now());

                        Alert savedAlert = alertRepository.save(alert);

                        // If high risk, auto-create an investigation case
                        if ("HIGH".equals(riskLevel)) {
                            createCaseIfAbsent(savedAlert, reasons);
                        }
                    }
                }
            } else if (!networkPatterns.isEmpty()) {
                // Flagged solely by network risk (e.g. laundering circle or layering)
                Alert alert = new Alert();
                alert.setTransactionId(transaction.getTransactionId());
                alert.setAccountId(transaction.getFromAccountId());
                alert.setRiskScore(combinedRiskScore);
                alert.setRiskLevel(riskLevel);
                alert.setAlertType(networkPatterns.get(0));
                alert.setDescription(reasons.isEmpty() ? "Suspicious network pattern detected." : String.join("; ", reasons));
                alert.setStatus("OPEN");
                alert.setCreatedAt(LocalDateTime.now());

                Alert savedAlert = alertRepository.save(alert);

                if ("HIGH".equals(riskLevel)) {
                    createCaseIfAbsent(savedAlert, reasons);
                }
            }
        }

        return new AMLResult(
                combinedRiskScore,
                riskLevel,
                flagged,
                allAlerts,
                ruleRiskScore,
                networkRiskScore,
                networkPatterns,
                reasons
        );
    }

    private void createCaseIfAbsent(Alert alert, List<String> reasons) {
        try {
            if (alert.getId() != null && caseRepository.findByAlertId(alert.getId()).isEmpty()) {
                AMLCase amlCase = new AMLCase();
                amlCase.setAlertId(alert.getId());
                amlCase.setAccountId(alert.getAccountId());
                amlCase.setPriority("HIGH");
                amlCase.setStatus("OPEN");
                amlCase.setAssignedTo("AML_ANALYST_QUEUE");

                String remarks = "Auto-escalated investigation case for alert #" + alert.getId();
                if (!reasons.isEmpty()) {
                    remarks += " - " + reasons.get(0);
                }
                amlCase.setRemarks(remarks);
                amlCase.setCreatedAt(LocalDateTime.now());

                caseRepository.save(amlCase);
                log.info("Auto-created high-risk investigation case for alert ID: {}", alert.getId());
            }
        } catch (Exception ex) {
            log.warn("Failed to auto-create investigation case for alert {}: {}", alert.getId(), ex.getMessage());
        }
    }

    private List<TransactionData> fetchNetworkTransactionContext(TransactionData currentTransaction) {
        List<TransactionData> list = new ArrayList<>();
        try {
            List<TransactionData> historical = transactionRestClient.get()
                    .uri("/api/transactions")
                    .retrieve()
                    .body(new ParameterizedTypeReference<List<TransactionData>>() {});

            if (historical != null) {
                list.addAll(historical);
            }
        } catch (Exception ex) {
            log.debug("Transaction service unavailable or empty at /api/transactions: {}. Using current transaction context.", ex.getMessage());
        }

        // Add current transaction to context if not already present
        boolean exists = list.stream().anyMatch(t ->
                t.getTransactionId() != null && t.getTransactionId().equals(currentTransaction.getTransactionId())
        );

        if (!exists) {
            list.add(currentTransaction);
        }

        return list;
    }
}