package com.aml.aml.dto;

import java.util.List;

public class AMLResult {

    private double riskScore;
    private String riskLevel;
    private boolean flagged;
    private List<String> alerts;

    public AMLResult(double riskScore, String riskLevel,
                     boolean flagged, List<String> alerts) {
        this.riskScore = riskScore;
        this.riskLevel = riskLevel;
        this.flagged = flagged;
        this.alerts = alerts;
    }

    public double getRiskScore() {
        return riskScore;
    }

    public String getRiskLevel() {
        return riskLevel;
    }

    public boolean isFlagged() {
        return flagged;
    }

    public List<String> getAlerts() {
        return alerts;
    }
}