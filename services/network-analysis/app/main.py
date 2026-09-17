from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.graph_service import build_graph
from app.risk_service import calculate_network_risk
from app.ml_anomaly_service import detect_anomalies

app = FastAPI(title="AML Network Analysis & ML Anomaly Service")

# =========================
# CORS Configuration
# =========================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8080",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================
# Health Check
# =========================
@app.get("/health")
def health():
    return {"status": "UP"}


# =========================
# Network Analysis API
# =========================
@app.post("/api/network/analyze")
def analyze_network(transactions: list[dict]):
    graph_data = build_graph(transactions)
    risk = calculate_network_risk(graph_data)
    ml_result = detect_anomalies(transactions, graph_data)

    return {
        "network": graph_data,
        "risk": risk,
        "mlAnomaly": ml_result
    }


# =========================
# Dedicated ML Anomaly API
# =========================
@app.post("/api/ml/anomaly")
def analyze_anomaly(transactions: list[dict]):
    graph_data = build_graph(transactions)
    return detect_anomalies(transactions, graph_data)