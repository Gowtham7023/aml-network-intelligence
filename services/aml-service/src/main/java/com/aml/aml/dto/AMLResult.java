package com.aml.aml.dto;

import java.util.ArrayList;
import java.util.List;

public class AMLResult {

    private double riskScore;
    private String riskLevel;
    private boolean flagged;
    private List<String> alerts;

    private double ruleRiskScore;
    private double networkRiskScore;
    private List<String> networkPatterns;
    private List<String> reasons;

    public AMLResult() {
        this.alerts = new ArrayList<>();
        this.networkPatterns = new ArrayList<>();
        this.reasons = new ArrayList<>();
    }

    public AMLResult(double riskScore, String riskLevel,
                     boolean flagged, List<String> alerts) {
        this.riskScore = riskScore;
        this.riskLevel = riskLevel;
        this.flagged = flagged;
        this.alerts = alerts != null ? alerts : new ArrayList<>();
        this.networkPatterns = new ArrayList<>();
        this.reasons = new ArrayList<>();
    }

    public AMLResult(double riskScore, String riskLevel, boolean flagged,
                     List<String> alerts, double ruleRiskScore, double networkRiskScore,
                     List<String> networkPatterns, List<String> reasons) {
        this.riskScore = riskScore;
        this.riskLevel = riskLevel;
        this.flagged = flagged;
        this.alerts = alerts != null ? alerts : new ArrayList<>();
        this.ruleRiskScore = ruleRiskScore;
        this.networkRiskScore = networkRiskScore;
        this.networkPatterns = networkPatterns != null ? networkPatterns : new ArrayList<>();
        this.reasons = reasons != null ? reasons : new ArrayList<>();
    }

    public double getRiskScore() {
        return riskScore;
    }

    public void setRiskScore(double riskScore) {
        this.riskScore = riskScore;
    }

    public String getRiskLevel() {
        return riskLevel;
    }

    public void setRiskLevel(String riskLevel) {
        this.riskLevel = riskLevel;
    }

    public boolean isFlagged() {
        return flagged;
    }

    public void setFlagged(boolean flagged) {
        this.flagged = flagged;
    }

    public List<String> getAlerts() {
        return alerts;
    }

    public void setAlerts(List<String> alerts) {
        this.alerts = alerts;
    }

    public double getRuleRiskScore() {
        return ruleRiskScore;
    }

    public void setRuleRiskScore(double ruleRiskScore) {
        this.ruleRiskScore = ruleRiskScore;
    }

    public double getNetworkRiskScore() {
        return networkRiskScore;
    }

    public void setNetworkRiskScore(double networkRiskScore) {
        this.networkRiskScore = networkRiskScore;
    }

    public List<String> getNetworkPatterns() {
        return networkPatterns;
    }

    public void setNetworkPatterns(List<String> networkPatterns) {
        this.networkPatterns = networkPatterns;
    }

    public List<String> getReasons() {
        return reasons;
    }

    public void setReasons(List<String> reasons) {
        this.reasons = reasons;
    }
}