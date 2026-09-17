def calculate_network_risk(graph_data):

    score = 0
    reasons = []

    if graph_data["nodeCount"] >= 5:
        score += 30
        reasons.append("Large transaction network")

    if graph_data["edgeCount"] >= 5:
        score += 30
        reasons.append("Multiple account connections")

    total_amount = sum(
        edge["totalAmount"]
        for edge in graph_data["edges"]
    )

    if total_amount >= 500000:
        score += 40
        reasons.append("High total transaction value")

    score = min(score, 100)

    if score >= 70:
        level = "HIGH"
    elif score >= 40:
        level = "MEDIUM"
    else:
        level = "LOW"

    return {
        "riskScore": score,
        "riskLevel": level,
        "reasons": reasons
    }