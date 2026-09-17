package com.aml.aml.service;

import com.aml.aml.dto.TransactionData;

public interface AMLRule {

    boolean matches(TransactionData transaction);

    String getAlertType();

    double getRiskScore();

    String getDescription();
}