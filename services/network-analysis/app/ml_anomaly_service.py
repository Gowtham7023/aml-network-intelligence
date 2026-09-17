import numpy as np
from sklearn.ensemble import IsolationForest


def detect_anomalies(transactions: list[dict], graph_data: dict = None) -> dict:
    """
    Lightweight ML-based anomaly detection using scikit-learn IsolationForest.
    Extracts features from transactions and graph topology.
    Safely falls back to heuristic scoring if insufficient training data exists (< 3 records).
    """
    if not transactions:
        return {
            "anomalyScore": 0.0,
            "isAnomaly": False,
            "riskLevel": "LOW",
            "modelStatus": "NO_DATA",
            "anomalousCount": 0,
            "anomalousTransactions": [],
            "reasons": ["No transaction records provided for ML analysis."]
        }

    # Extract node degrees and cycles from graph_data if available
    node_degrees = {}
    cycle_nodes = set()
    if graph_data:
        for node in graph_data.get("nodes", []):
            node_degrees[node["id"]] = node.get("connections", 1)
            if node.get("inCycle"):
                cycle_nodes.add(node["id"])

    # Feature extraction per transaction:
    # [amount, source_degree, target_degree, is_cross_border, is_cyclic]
    feature_rows = []
    parsed_txs = []

    for idx, tx in enumerate(transactions):
        try:
            amount = float(tx.get("amount") or 0.0)
        except (ValueError, TypeError):
            amount = 0.0

        src = tx.get("fromAccountId", "")
        tgt = tx.get("toAccountId", "")
        country = str(tx.get("country") or "India").strip().lower()

        is_cross_border = 1 if country != "india" else 0
        src_deg = node_degrees.get(src, 1)
        tgt_deg = node_degrees.get(tgt, 1)
        is_cyclic = 1 if (src in cycle_nodes or tgt in cycle_nodes) else 0

        feature_rows.append([amount, src_deg, tgt_deg, is_cross_border, is_cyclic])
        parsed_txs.append({
            "index": idx,
            "transactionId": tx.get("transactionId") or tx.get("id") or idx + 1,
            "fromAccountId": src,
            "toAccountId": tgt,
            "amount": amount,
            "isCrossBorder": bool(is_cross_border),
            "isCyclic": bool(is_cyclic)
        })

    n_samples = len(feature_rows)

    # ==========================================
    # SAFE COLD-START / LIMITED DATA FALLBACK
    # ==========================================
    if n_samples < 3:
        # Heuristic fallback for 1 or 2 transactions
        anomalous_txs = []
        reasons = []
        highest_score = 0.0

        for tx in parsed_txs:
            score = 0.0
            reasons_tx = []
            if tx["amount"] >= 100000:
                score += 45.0
                reasons_tx.append(f"High amount ({tx['amount']:,.2f}) flagged by baseline heuristic")
            elif tx["amount"] >= 90000:
                score += 25.0
                reasons_tx.append(f"Threshold structuring amount ({tx['amount']:,.2f})")

            if tx["isCrossBorder"]:
                score += 25.0
                reasons_tx.append("Cross-border transaction")

            if tx["isCyclic"]:
                score += 30.0
                reasons_tx.append("Participant in cyclic laundering ring")

            if score > highest_score:
                highest_score = score

            if score >= 40.0:
                anomalous_txs.append({
                    "transactionId": tx["transactionId"],
                    "fromAccountId": tx["fromAccountId"],
                    "toAccountId": tx["toAccountId"],
                    "amount": tx["amount"],
                    "anomalyScore": round(min(score, 100.0), 2),
                    "reasons": reasons_tx
                })
                reasons.extend(reasons_tx)

        highest_score = round(min(highest_score, 100.0), 2)
        is_anomaly = highest_score >= 40.0
        risk_level = "HIGH" if highest_score >= 70.0 else "MEDIUM" if highest_score >= 40.0 else "LOW"

        if not reasons:
            reasons.append("Single/low sample volume within standard baseline limits.")

        return {
            "anomalyScore": highest_score,
            "isAnomaly": is_anomaly,
            "riskLevel": risk_level,
            "modelStatus": "HEURISTIC_FALLBACK (Sample count < 3)",
            "anomalousCount": len(anomalous_txs),
            "anomalousTransactions": anomalous_txs,
            "reasons": list(dict.fromkeys(reasons))
        }

    # ==========================================
    # SCIKIT-LEARN ISOLATION FOREST
    # ==========================================
    X = np.array(feature_rows, dtype=float)

    # Determine dynamic contamination based on sample size
    contamination = min(0.3, max(0.05, 1.0 / n_samples))

    try:
        clf = IsolationForest(
            n_estimators=50,
            contamination=contamination,
            random_state=42
        )
        clf.fit(X)

        # -1 for anomaly, 1 for inlier
        predictions = clf.predict(X)
        # Lower decision scores indicate higher anomaly severity
        decision_scores = clf.decision_function(X)

        # Normalize decision score to [0, 100] risk scale
        # Normal inliers usually range between [0.0, 0.3], outliers <= 0.0
        anomalous_txs = []
        global_reasons = []
        amounts = [tx["amount"] for tx in parsed_txs]
        median_amount = float(np.median(amounts))

        max_anomaly_score = 0.0

        for i in range(n_samples):
            pred = predictions[i]
            dec_score = decision_scores[i]
            tx = parsed_txs[i]

            # Invert and scale: dec_score <= 0 maps to 50 - 100, dec_score > 0 maps to 0 - 50
            if dec_score < 0:
                scaled_score = 50.0 + min(50.0, abs(dec_score) * 150.0)
            else:
                scaled_score = max(0.0, 50.0 - (dec_score * 120.0))

            scaled_score = round(min(100.0, max(0.0, scaled_score)), 2)
            if scaled_score > max_anomaly_score:
                max_anomaly_score = scaled_score

            # If flagged by Isolation Forest or elevated score
            if pred == -1 or scaled_score >= 50.0:
                reasons_tx = []
                if median_amount > 0 and tx["amount"] > 1.8 * median_amount:
                    ratio = round(tx["amount"] / median_amount, 1)
                    reasons_tx.append(f"Amount {tx['amount']:,.2f} is {ratio}x higher than cohort median")
                elif tx["amount"] >= 100000:
                    reasons_tx.append(f"High transaction volume ({tx['amount']:,.2f})")

                if tx["isCrossBorder"]:
                    reasons_tx.append("Cross-border transfer in atypical cluster")

                if tx["isCyclic"]:
                    reasons_tx.append("Graph topology exhibits cyclic fund circulation")

                if not reasons_tx:
                    reasons_tx.append(f"Multi-dimensional anomaly detected by IsolationForest (Score: {scaled_score})")

                anomalous_txs.append({
                    "transactionId": tx["transactionId"],
                    "fromAccountId": tx["fromAccountId"],
                    "toAccountId": tx["toAccountId"],
                    "amount": tx["amount"],
                    "anomalyScore": scaled_score,
                    "reasons": reasons_tx
                })
                global_reasons.extend(reasons_tx)

        max_anomaly_score = round(max_anomaly_score, 2)
        is_anomaly = len(anomalous_txs) > 0 or max_anomaly_score >= 50.0
        risk_level = "HIGH" if max_anomaly_score >= 70.0 else "MEDIUM" if max_anomaly_score >= 40.0 else "LOW"

        if not global_reasons:
            global_reasons.append("All transactions align within normal statistical distribution patterns.")

        return {
            "anomalyScore": max_anomaly_score,
            "isAnomaly": is_anomaly,
            "riskLevel": risk_level,
            "modelStatus": f"ACTIVE_ISOLATION_FOREST (Samples: {n_samples})",
            "anomalousCount": len(anomalous_txs),
            "anomalousTransactions": anomalous_txs,
            "reasons": list(dict.fromkeys(global_reasons))
        }

    except Exception as ex:
        # Failsafe fallback in case of numerical edge cases
        return {
            "anomalyScore": 0.0,
            "isAnomaly": False,
            "riskLevel": "LOW",
            "modelStatus": f"ERROR_FALLBACK ({str(ex)})",
            "anomalousCount": 0,
            "anomalousTransactions": [],
            "reasons": ["ML anomaly engine recovered gracefully from data formatting issue."]
        }

