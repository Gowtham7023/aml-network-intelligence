def calculate_network_risk(graph_data):
    """
    Evaluates topological risk factors across the transaction graph:
    - Circular transaction loops (Round-tripping)
    - Multi-hop chains (Layering)
    - High-degree hubs (Money mules / shell conduits)
    - Cross-border transaction exposure
    - Total transaction volume & network density
    """
    score = 0
    reasons = []
    detected_patterns = []

    if not graph_data or graph_data.get("nodeCount", 0) == 0:
        return {
            "riskScore": 0,
            "riskLevel": "LOW",
            "reasons": ["No transaction network data available."],
            "detectedPatterns": []
        }

    # 1. Circular Transaction Patterns (Highest AML indicator: round-tripping / wash trading)
    circular_patterns = graph_data.get("circularPatterns", [])
    if circular_patterns:
        score += 35
        cycle_preview = " -> ".join(circular_patterns[0])
        reasons.append(
            f"Circular transaction flow detected ({len(circular_patterns)} cycle(s) identified, e.g. {cycle_preview})"
        )
        detected_patterns.append("CIRCULAR_TRANSACTIONS")

    # 2. Multi-Hop Layering Chains (Funds routed through multiple intermediaries)
    multi_hop_chains = graph_data.get("multiHopChains", [])
    if multi_hop_chains:
        score += 25
        chain_preview = " -> ".join(multi_hop_chains[0])
        hops = len(multi_hop_chains[0]) - 1
        reasons.append(
            f"Multi-hop layering detected: funds traversing {hops} hops (e.g. {chain_preview})"
        )
        detected_patterns.append("LAYERING_CHAIN")

    # 3. Highly Connected Accounts (Hubs / Funnels)
    high_degree_accounts = graph_data.get("highlyConnectedAccounts", [])
    if high_degree_accounts:
        score += 20
        acc_preview = ", ".join(high_degree_accounts[:3])
        reasons.append(
            f"High-degree account hub(s) detected ({acc_preview}) acting as central money conduits"
        )
        detected_patterns.append("HIGH_DEGREE_HUB")

    # 4. Cross-Border Activity
    cross_border_txs = graph_data.get("crossBorderTransactions", [])
    if cross_border_txs:
        score += 20
        reasons.append(
            f"Cross-border transaction activity detected across {len(cross_border_txs)} edge(s)"
        )
        detected_patterns.append("CROSS_BORDER_ACTIVITY")

    # 5. Total Transaction Value Across Network
    total_amount = sum(
        float(edge.get("amount", 0))
        for edge in graph_data.get("edges", [])
    )
    if total_amount >= 1000000:
        score += 30
        reasons.append(f"Very high network transaction volume (Total: {total_amount:,.2f})")
        detected_patterns.append("HIGH_VALUE_NETWORK")
    elif total_amount >= 500000:
        score += 20
        reasons.append(f"Elevated network transaction volume (Total: {total_amount:,.2f})")
        detected_patterns.append("HIGH_VALUE_NETWORK")

    # 6. Network Size & Edge Density
    node_count = graph_data.get("nodeCount", 0)
    edge_count = graph_data.get("edgeCount", 0)
    if node_count >= 5 or edge_count >= 5:
        score += 15
        reasons.append(f"Interconnected account network ({node_count} nodes, {edge_count} edges)")
        detected_patterns.append("COMPLEX_TOPOLOGY")

    # Clamping risk score between 0 and 100
    score = min(score, 100)

    # Risk level categorization
    if score >= 70:
        level = "HIGH"
    elif score >= 40:
        level = "MEDIUM"
    else:
        level = "LOW"

    if not reasons:
        reasons.append("Network activity is within expected baseline parameters.")

    return {
        "riskScore": score,
        "riskLevel": level,
        "reasons": reasons,
        "detectedPatterns": detected_patterns
    }