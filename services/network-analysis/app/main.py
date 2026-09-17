from fastapi import FastAPI
from app.graph_service import build_graph
from app.risk_service import calculate_network_risk

app = FastAPI(title="AML Network Analysis Service")


@app.get("/health")
def health():
    return {"status": "UP"}


@app.post("/api/network/analyze")
def analyze_network(transactions: list[dict]):

    graph_data = build_graph(transactions)
    risk = calculate_network_risk(graph_data)

    return {
        "network": graph_data,
        "risk": risk
    }