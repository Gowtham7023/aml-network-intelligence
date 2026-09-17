from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.graph_service import build_graph
from app.risk_service import calculate_network_risk


app = FastAPI(
    title="AML Network Analysis Service"
)


# =========================
# CORS
# =========================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================
# HEALTH CHECK
# =========================

@app.get("/health")
def health():

    return {
        "status": "UP"
    }


# =========================
# NETWORK ANALYSIS
# =========================

@app.post("/api/network/analyze")
def analyze_network(transactions: list[dict]):

    graph_data = build_graph(
        transactions
    )

    risk = calculate_network_risk(
        graph_data
    )

    return {
        "network": graph_data,
        "risk": risk
    }