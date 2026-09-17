package com.aml.aml.dto;

import java.util.Map;

public class NetworkAnalysisResponse {

    private Map<String, Object> network;
    private NetworkRiskData risk;

    public NetworkAnalysisResponse() {
    }

    public NetworkAnalysisResponse(Map<String, Object> network, NetworkRiskData risk) {
        this.network = network;
        this.risk = risk;
    }

    public Map<String, Object> getNetwork() {
        return network;
    }

    public void setNetwork(Map<String, Object> network) {
        this.network = network;
    }

    public NetworkRiskData getRisk() {
        return risk;
    }

    public void setRisk(NetworkRiskData risk) {
        this.risk = risk;
    }
}

