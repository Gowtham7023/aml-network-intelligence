package com.aml.aml.service;

import org.springframework.stereotype.Component;

import com.aml.aml.dto.TransactionData;

@Component
public class HighValueRule implements AMLRule {

    private static final double THRESHOLD = 100000.0;

    @Override
    public boolean matches(TransactionData transaction) {
        return transaction.getAmount() != null
                && transaction.getAmount() >= THRESHOLD;
    }

    @Override
    public String getAlertType() {
        return "HIGH_VALUE_TRANSACTION";
    }

    @Override
    public double getRiskScore() {
        return 40.0;
    }

    @Override
    public String getDescription() {
        return "Transaction amount exceeds the AML high-value threshold.";
    }
}