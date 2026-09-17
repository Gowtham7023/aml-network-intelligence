package com.aml.aml.service;

import org.springframework.stereotype.Component;

import com.aml.aml.dto.TransactionData;

@Component
public class RapidTransferRule implements AMLRule {

    @Override
    public boolean matches(TransactionData transaction) {
        return transaction.getFromAccountId() != null
                && transaction.getToAccountId() != null
                && transaction.getFromAccountId().equals(transaction.getToAccountId());
    }

    @Override
    public String getAlertType() {
        return "RAPID_TRANSFER_PATTERN";
    }

    @Override
    public double getRiskScore() {
        return 15.0;
    }

    @Override
    public String getDescription() {
        return "Transaction shows a potentially suspicious rapid movement pattern.";
    }
}