package com.aml.aml.service;

import org.springframework.stereotype.Component;

import com.aml.aml.dto.TransactionData;

@Component
public class StructuringRule implements AMLRule {

    @Override
    public boolean matches(TransactionData transaction) {
        return transaction.getAmount() != null
                && transaction.getAmount() >= 90000
                && transaction.getAmount() < 100000;
    }

    @Override
    public String getAlertType() {
        return "POSSIBLE_STRUCTURING";
    }

    @Override
    public double getRiskScore() {
        return 25.0;
    }

    @Override
    public String getDescription() {
        return "Transaction is close to the high-value threshold and may indicate structuring.";
    }
}