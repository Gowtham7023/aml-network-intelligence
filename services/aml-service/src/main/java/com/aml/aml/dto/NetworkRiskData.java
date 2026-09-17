package com.aml.aml.dto;

import java.util.ArrayList;
import java.util.List;

public class NetworkRiskData {

    private Double riskScore = 0.0;
    private String riskLevel = "LOW";
    private List<String> reasons = new ArrayList<>();
    private List<String> detectedPatterns = new ArrayList<>();

    public NetworkRiskData() {
    }

    public NetworkRiskData(Double riskScore, String riskLevel, List<String> reasons, List<String> detectedPatterns) {
        this.riskScore = riskScore != null ? riskScore : 0.0;
        this.riskLevel = riskLevel != null ? riskLevel : "LOW";
        this.reasons = reasons != null ? reasons : new ArrayList<>();
        this.detectedPatterns = detectedPatterns != null ? detectedPatterns : new ArrayList<>();
    }

    public Double getRiskScore() {
        return riskScore;
    }

    public void setRiskScore(Double riskScore) {
        this.riskScore = riskScore;
    }

    public String getRiskLevel() {
        return riskLevel;
    }

    public void setRiskLevel(String riskLevel) {
        this.riskLevel = riskLevel;
    }

    public List<String> getReasons() {
        return reasons;
    }

    public void setReasons(List<String> reasons) {
        this.reasons = reasons;
    }

    public List<String> getDetectedPatterns() {
        return detectedPatterns;
    }

    public void setDetectedPatterns(List<String> detectedPatterns) {
        this.detectedPatterns = detectedPatterns;
    }
}

