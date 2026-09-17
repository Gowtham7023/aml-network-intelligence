package com.aml.aml.service;

import org.springframework.stereotype.Component;

import com.aml.aml.dto.TransactionData;

@Component
public class UnusualCountryRule implements AMLRule {

    @Override
    public boolean matches(TransactionData transaction) {
        return transaction.getCountry() != null
                && !transaction.getCountry().equalsIgnoreCase("India");
    }

    @Override
    public String getAlertType() {
        return "UNUSUAL_COUNTRY";
    }

    @Override
    public double getRiskScore() {
        return 20.0;
    }

    @Override
    public String getDescription() {
        return "Transaction originated from a country outside the expected operating region.";
    }
}