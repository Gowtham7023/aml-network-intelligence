package com.aml.aml.service;

import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import com.aml.aml.dto.NetworkAnalysisResponse;
import com.aml.aml.dto.NetworkRiskData;
import com.aml.aml.dto.TransactionData;

@Service
public class NetworkAnalysisClient {

    private static final Logger log = LoggerFactory.getLogger(NetworkAnalysisClient.class);

    private final RestClient restClient;
    private final String networkServiceUrl;

    public NetworkAnalysisClient(
            @Value("${network.analysis.url:http://localhost:8004}") String networkServiceUrl) {
        this.networkServiceUrl = networkServiceUrl;
        this.restClient = RestClient.builder().baseUrl(networkServiceUrl).build();
    }

    public NetworkAnalysisResponse analyzeNetwork(List<TransactionData> transactions) {
        try {
            return restClient.post()
                    .uri("/api/network/analyze")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(transactions)
                    .retrieve()
                    .body(NetworkAnalysisResponse.class);
        } catch (Exception ex) {
            log.warn("Network analysis service unavailable at {}: {}. Falling back gracefully.",
                    networkServiceUrl, ex.getMessage());
            NetworkRiskData fallbackRisk = new NetworkRiskData(
                    0.0,
                    "LOW",
                    List.of("Network analysis service offline - evaluated using transaction-level rules."),
                    List.of()
            );
            return new NetworkAnalysisResponse(Map.of(), fallbackRisk);
        }
    }
}

