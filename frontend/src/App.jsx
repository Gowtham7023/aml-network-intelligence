import { useEffect, useState } from "react";
import axios from "axios";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";

import "./App.css";

// Dynamic API endpoints supporting Gateway (8080) or direct service ports
const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL || "http://localhost:8080";
const TRANSACTION_API =
  import.meta.env.VITE_TRANSACTION_URL ||
  "http://localhost:8081/api/transactions";
const AML_API = import.meta.env.VITE_AML_URL || "http://localhost:8083/api/aml";
const CASES_API =
  import.meta.env.VITE_CASES_URL || "http://localhost:8083/api/cases";
const NETWORK_API =
  import.meta.env.VITE_NETWORK_URL || "http://localhost:8004/api/network";

function App() {
  const [activePage, setActivePage] = useState("Dashboard");

  // =========================
  // BACKEND DATA
  // =========================
  const [transactions, setTransactions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [cases, setCases] = useState([]);

  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);

  // New Transaction Form State
  const [txForm, setTxForm] = useState({
    fromAccountId: "ACC10001",
    toAccountId: "ACC20001",
    amount: "150000",
    currency: "INR",
    channel: "ONLINE",
    country: "India",
    deviceId: "DEV001",
  });
  const [txSubmitting, setTxSubmitting] = useState(false);
  const [instantAmlResult, setInstantAmlResult] = useState(null);

  // =========================
  // NETWORK & ML ANALYSIS
  // =========================
  const [networkAnalysis, setNetworkAnalysis] = useState(null);
  const [loadingNetwork, setLoadingNetwork] = useState(false);

  // =========================
  // LOAD BACKEND DATA
  // =========================
  useEffect(() => {
    loadTransactions();
    loadAlerts();
    loadCases();
  }, []);

  // Analyze network whenever transactions change
  useEffect(() => {
    if (transactions.length > 0) {
      analyzeNetwork();
    } else {
      setNetworkAnalysis(null);
    }
  }, [transactions]);

  // =========================
  // TRANSACTIONS
  // =========================
  const loadTransactions = async () => {
    setLoadingTransactions(true);
    try {
      const response = await axios
        .get(TRANSACTION_API)
        .catch(() => axios.get(`${GATEWAY_URL}/api/transactions`));
      setTransactions(response.data || []);
    } catch (error) {
      console.error("Failed to load transactions:", error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  // =========================
  // ALERTS
  // =========================
  const loadAlerts = async () => {
    try {
      const response = await axios
        .get(`${AML_API}/alerts`)
        .catch(() => axios.get(`${GATEWAY_URL}/api/aml/alerts`));
      setAlerts(response.data || []);
    } catch (error) {
      console.error("Failed to load alerts:", error);
    }
  };

  // =========================
  // CASES
  // =========================
  const loadCases = async () => {
    try {
      const response = await axios
        .get(CASES_API)
        .catch(() => axios.get(`${GATEWAY_URL}/api/cases`));
      setCases(response.data || []);
    } catch (error) {
      console.error("Failed to load cases:", error);
    }
  };

  // =========================
  // PYTHON NETWORK ANALYSIS
  // =========================
  const analyzeNetwork = async () => {
    if (transactions.length === 0) {
      setNetworkAnalysis(null);
      return;
    }

    setLoadingNetwork(true);
    try {
      const response = await axios
        .post(`${NETWORK_API}/analyze`, transactions)
        .catch(() =>
          axios.post(`${GATEWAY_URL}/api/network/analyze`, transactions),
        );
      setNetworkAnalysis(response.data);
    } catch (error) {
      console.error("Failed to analyze network:", error);
      setNetworkAnalysis(null);
    } finally {
      setLoadingNetwork(false);
    }
  };

  // Handle submitting new transaction and evaluating AML risk
  const handleCreateTransaction = async (e) => {
    e.preventDefault();
    setTxSubmitting(true);
    setInstantAmlResult(null);

    const payload = {
      fromAccountId: txForm.fromAccountId.trim(),
      toAccountId: txForm.toAccountId.trim(),
      amount: parseFloat(txForm.amount) || 0,
      currency: txForm.currency.trim(),
      channel: txForm.channel.trim(),
      country: txForm.country.trim(),
      deviceId: txForm.deviceId.trim(),
    };

    try {
      // 1. Create transaction in Transaction Service
      const txRes = await axios
        .post(TRANSACTION_API, payload)
        .catch(() => axios.post(`${GATEWAY_URL}/api/transactions`, payload));

      // 2. Evaluate transaction with AML Service
      const amlPayload = {
        ...payload,
        transactionId: txRes.data.id || Date.now(),
      };
      const amlRes = await axios
        .post(`${AML_API}/analyze`, amlPayload)
        .catch(() => axios.post(`${GATEWAY_URL}/api/aml/analyze`, amlPayload));

      setInstantAmlResult(amlRes.data);

      // Refresh data
      await loadTransactions();
      await loadAlerts();
      await loadCases();
    } catch (error) {
      console.error("Transaction submission / AML analysis failed:", error);
      alert("Failed to submit transaction. Verify services are running.");
    } finally {
      setTxSubmitting(false);
    }
  };

  // Handle case status update
  const handleUpdateCaseStatus = async (caseId, newStatus) => {
    try {
      await axios
        .put(`${CASES_API}/${caseId}`, { status: newStatus })
        .catch(() =>
          axios.put(`${GATEWAY_URL}/api/cases/${caseId}`, {
            status: newStatus,
          }),
        );
      loadCases();
    } catch (error) {
      console.error("Failed to update case status:", error);
    }
  };

  // =========================
  // METRIC CALCULATIONS
  // =========================
  const totalTransactions = transactions.length;

  const transactionVolume = transactions.reduce(
    (total, transaction) => total + Number(transaction.amount || 0),
    0,
  );

  const highRiskAlerts = alerts.filter((a) => a.riskLevel === "HIGH").length;
  const openCases = cases.filter((c) => c.status === "OPEN").length;

  const network = networkAnalysis?.network;
  const risk = networkAnalysis?.risk;
  const mlAnomaly = networkAnalysis?.mlAnomaly;

  const circularCount = network?.circularPatterns?.length || 0;
  const layeringCount = network?.multiHopChains?.length || 0;
  const crossBorderCount = network?.crossBorderTransactions?.length || 0;
  const highDegreeCount = network?.highlyConnectedAccounts?.length || 0;

  // =========================
  // RISK DATA FOR CHART
  // =========================
  const riskData = [
    {
      name: "Low",
      value: alerts.filter((a) => a.riskLevel === "LOW").length,
      color: "#10b981",
    },
    {
      name: "Medium",
      value: alerts.filter((a) => a.riskLevel === "MEDIUM").length,
      color: "#f59e0b",
    },
    {
      name: "High",
      value: alerts.filter(
        (a) => a.riskLevel === "HIGH" || a.riskLevel === "ALERT",
      ).length,
      color: "#ef4444",
    },
  ];

  // Dynamic weekly or day-wise chart calculation from real transactions
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const transactionChart = daysOfWeek.map((day) => ({
    day,
    transactions: 0,
    volume: 0,
  }));

  transactions.forEach((tx) => {
    if (tx.transactionTime) {
      const d = new Date(tx.transactionTime);
      const dayName = daysOfWeek[d.getDay()];
      const found = transactionChart.find((c) => c.day === dayName);
      if (found) {
        found.transactions += 1;
        found.volume += Number(tx.amount || 0);
      }
    } else {
      transactionChart[1].transactions += 1;
      transactionChart[1].volume += Number(tx.amount || 0);
    }
  });

  // Format currency
  const formatAmount = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const getRiskBadge = (level) => {
    const l = (level || "LOW").toUpperCase();
    if (l === "HIGH" || l === "ALERT")
      return <span className="badge badge-high">HIGH</span>;
    if (l === "MEDIUM")
      return <span className="badge badge-medium">MEDIUM</span>;
    return <span className="badge badge-low">LOW</span>;
  };

  // =========================
  // SIDEBAR
  // =========================
  const Sidebar = () => (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h2>🛡️ AML Network</h2>
        <span className="brand-subtitle">Intelligence System</span>
      </div>

      <div
        className={activePage === "Dashboard" ? "nav active" : "nav"}
        onClick={() => setActivePage("Dashboard")}
      >
        📊 Dashboard
      </div>

      <div
        className={activePage === "Transactions" ? "nav active" : "nav"}
        onClick={() => setActivePage("Transactions")}
      >
        💳 Transactions
      </div>

      <div
        className={activePage === "Alerts" ? "nav active" : "nav"}
        onClick={() => setActivePage("Alerts")}
      >
        🚨 AML Alerts
      </div>

      <div
        className={activePage === "Cases" ? "nav active" : "nav"}
        onClick={() => setActivePage("Cases")}
      >
        📁 Investigation Cases
      </div>

      <div
        className={activePage === "Network" ? "nav active" : "nav"}
        onClick={() => setActivePage("Network")}
      >
        🕸️ Network & ML
      </div>

      <div className="sidebar-footer">
        <small>Real-time Financial Surveillance</small>
      </div>
    </aside>
  );

  // =========================
  // HEADER
  // =========================
  const Header = () => (
    <header>
      <div>
        <h1>{activePage}</h1>
        <p>Anti-Money Laundering Surveillance & Network Anomaly Intelligence</p>
      </div>

      <div className="header-actions">
        <button
          className="btn-refresh"
          onClick={() => {
            loadTransactions();
            loadAlerts();
            loadCases();
          }}
        >
          🔄 Refresh Data
        </button>
        <div className="user">👤 AML Lead Analyst</div>
      </div>
    </header>
  );

  // =========================
  // DASHBOARD VIEW
  // =========================
  const Dashboard = () => (
    <>
      {/* KPI METRIC CARDS */}
      <section className="cards">
        <div className="card">
          <span>Total Transactions</span>
          <strong>{totalTransactions}</strong>
          <small>Transaction Service (:8081)</small>
        </div>

        <div className="card">
          <span>Total Processed Volume</span>
          <strong>{formatAmount(transactionVolume)}</strong>
          <small>Aggregated financial flow</small>
        </div>

        <div className="card danger">
          <span>High-Risk Alerts</span>
          <strong>{highRiskAlerts}</strong>
          <small>AML Rules & Graph Detection</small>
        </div>

        <div className="card warning">
          <span>Open Investigation Cases</span>
          <strong>{openCases}</strong>
          <small>Active analyst queue</small>
        </div>
      </section>

      {/* DETECTED AML TOPOLOGY PATTERNS SUMMARY */}
      <section className="patterns-banner panel">
        <h3>🔍 Network Intelligence & ML Surveillance Highlights</h3>
        <div className="pattern-badges-grid">
          <div
            className={`pattern-card ${circularCount > 0 ? "alert-card" : ""}`}
          >
            <div className="pattern-icon">🔄</div>
            <div>
              <strong>{circularCount} Circular Laundering Loops</strong>
              <p>
                {circularCount > 0
                  ? "Round-tripping fund cycles identified"
                  : "No circular transaction loops"}
              </p>
            </div>
          </div>

          <div
            className={`pattern-card ${layeringCount > 0 ? "alert-card" : ""}`}
          >
            <div className="pattern-icon">⛓️</div>
            <div>
              <strong>{layeringCount} Multi-Hop Layering Chains</strong>
              <p>
                {layeringCount > 0
                  ? "Complex fund dispersal across 3+ hops"
                  : "No deep layering paths detected"}
              </p>
            </div>
          </div>

          <div
            className={`pattern-card ${crossBorderCount > 0 ? "warning-card" : ""}`}
          >
            <div className="pattern-icon">🌐</div>
            <div>
              <strong>{crossBorderCount} Cross-Border Transfers</strong>
              <p>
                {crossBorderCount > 0
                  ? "Jurisdictional risk flagged"
                  : "Domestic transaction activity"}
              </p>
            </div>
          </div>

          <div
            className={`pattern-card ${mlAnomaly?.isAnomaly ? "alert-card" : ""}`}
          >
            <div className="pattern-icon">🤖</div>
            <div>
              <strong>ML Anomaly Score: {mlAnomaly?.anomalyScore || 0}%</strong>
              <p>
                {mlAnomaly?.isAnomaly
                  ? `IsolationForest flagged ${mlAnomaly?.anomalousCount} outlier(s)`
                  : "Normal distribution alignment"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CHARTS GRID */}
      <section className="grid">
        <div className="panel">
          <h3>Weekly Transaction Activity</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={transactionChart}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" />
              <YAxis allowDecimals={false} />
              <Tooltip
                formatter={(value, name) => [
                  value,
                  name === "transactions" ? "Transactions" : "Volume",
                ]}
              />
              <Bar
                dataKey="transactions"
                fill="#2563eb"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="panel">
          <h3>Alert Risk Distribution</h3>
          {alerts.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={riskData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data">No alerts logged yet.</div>
          )}
        </div>
      </section>

      {/* RECENT ALERTS TABLE */}
      <section className="panel">
        <div className="panel-header">
          <h3>🚨 Recent AML Alerts & System Flags</h3>
          <button className="btn-primary" onClick={loadAlerts}>
            Refresh
          </button>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Alert ID</th>
              <th>Account</th>
              <th>Alert Type</th>
              <th>Risk Score</th>
              <th>Risk Level</th>
              <th>Status</th>
              <th>Description / Network Reason</th>
            </tr>
          </thead>
          <tbody>
            {alerts.slice(0, 8).map((alert) => (
              <tr key={alert.id}>
                <td>
                  <strong>#{alert.id}</strong>
                </td>
                <td>
                  <span className="account-tag">{alert.accountId}</span>
                </td>
                <td>
                  <span className="alert-type-tag">{alert.alertType}</span>
                </td>
                <td>
                  <strong>{alert.riskScore}</strong>/100
                </td>
                <td>{getRiskBadge(alert.riskLevel)}</td>
                <td>
                  <span
                    className={`status-pill ${alert.status?.toLowerCase()}`}
                  >
                    {alert.status}
                  </span>
                </td>
                <td className="description-cell">
                  {alert.description || "N/A"}
                </td>
              </tr>
            ))}
            {alerts.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center">
                  No AML alerts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </>
  );

  // =========================
  // TRANSACTIONS PAGE
  // =========================
  const TransactionsPage = () => (
    <>
      {/* CREATE TRANSACTION & TEST AML RISK */}
      <section className="panel">
        <div className="panel-header">
          <h3>⚡ Submit Transaction & Live AML Risk Analysis</h3>
          <span className="info-tag">
            Instant Rule + Graph + ML Verification
          </span>
        </div>

        <form onSubmit={handleCreateTransaction} className="tx-form">
          <div className="form-group">
            <label>From Account ID</label>
            <input
              type="text"
              required
              value={txForm.fromAccountId}
              onChange={(e) =>
                setTxForm({ ...txForm, fromAccountId: e.target.value })
              }
              placeholder="e.g. ACC10001"
            />
          </div>

          <div className="form-group">
            <label>To Account ID</label>
            <input
              type="text"
              required
              value={txForm.toAccountId}
              onChange={(e) =>
                setTxForm({ ...txForm, toAccountId: e.target.value })
              }
              placeholder="e.g. ACC20001"
            />
          </div>

          <div className="form-group">
            <label>Amount (INR)</label>
            <input
              type="number"
              step="any"
              required
              value={txForm.amount}
              onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
              placeholder="e.g. 150000"
            />
          </div>

          <div className="form-group">
            <label>Country</label>
            <select
              value={txForm.country}
              onChange={(e) =>
                setTxForm({ ...txForm, country: e.target.value })
              }
            >
              <option value="India">India (Domestic)</option>
              <option value="Singapore">Singapore (Cross-Border)</option>
              <option value="UAE">UAE (Cross-Border)</option>
              <option value="Mauritius">Mauritius (High Risk)</option>
              <option value="Cayman Islands">Cayman Islands (Offshore)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Channel</label>
            <select
              value={txForm.channel}
              onChange={(e) =>
                setTxForm({ ...txForm, channel: e.target.value })
              }
            >
              <option value="ONLINE">ONLINE (Net Banking)</option>
              <option value="WIRE">WIRE / SWIFT</option>
              <option value="ATM">ATM / Cash Deposit</option>
              <option value="UPI">UPI / Mobile</option>
            </select>
          </div>

          <div className="form-group">
            <label>Device ID</label>
            <input
              type="text"
              value={txForm.deviceId}
              onChange={(e) =>
                setTxForm({ ...txForm, deviceId: e.target.value })
              }
            />
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn-primary"
              disabled={txSubmitting}
            >
              {txSubmitting
                ? "Evaluating AML Risk..."
                : "🚀 Process & Analyze Risk"}
            </button>
          </div>
        </form>

        {/* INSTANT RISK ASSESSMENT BANNER */}
        {instantAmlResult && (
          <div
            className={`instant-result-banner risk-${(instantAmlResult.riskLevel || "LOW").toLowerCase()}`}
          >
            <div className="instant-header">
              <h4>🎯 AML Risk Engine Assessment</h4>
              <div className="instant-scores">
                <span>
                  Overall Risk:{" "}
                  <strong>{instantAmlResult.riskScore}/100</strong>
                </span>
                <span>Level: {getRiskBadge(instantAmlResult.riskLevel)}</span>
                <span>
                  Flagged:{" "}
                  <strong>
                    {instantAmlResult.flagged ? "🚨 YES" : "✅ NO"}
                  </strong>
                </span>
              </div>
            </div>

            <div className="instant-breakdown">
              <div>
                <strong>Rule Score:</strong>{" "}
                {instantAmlResult.ruleRiskScore || 0} pts
              </div>
              <div>
                <strong>Network Topology Score:</strong>{" "}
                {instantAmlResult.networkRiskScore || 0} pts
              </div>
              {instantAmlResult.networkPatterns?.length > 0 && (
                <div>
                  <strong>Network Patterns:</strong>{" "}
                  {instantAmlResult.networkPatterns.join(", ")}
                </div>
              )}
            </div>

            {instantAmlResult.reasons?.length > 0 && (
              <div className="instant-reasons">
                <strong>Analysis Factors:</strong>
                <ul>
                  {instantAmlResult.reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>

      {/* TRANSACTION MONITORING TABLE */}
      <section className="panel">
        <div className="panel-header">
          <h3>💳 Transaction History</h3>
          <button className="btn-primary" onClick={loadTransactions}>
            Refresh
          </button>
        </div>

        {loadingTransactions ? (
          <p>Loading transactions...</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>From Account</th>
                <th>To Account</th>
                <th>Amount</th>
                <th>Currency</th>
                <th>Channel</th>
                <th>Country</th>
                <th>Device</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td>
                    <strong>#{tx.id}</strong>
                  </td>
                  <td>
                    <span className="account-tag">{tx.fromAccountId}</span>
                  </td>
                  <td>
                    <span className="account-tag">{tx.toAccountId}</span>
                  </td>
                  <td className="amount-cell">
                    {formatAmount(tx.amount || 0)}
                  </td>
                  <td>{tx.currency}</td>
                  <td>
                    <span className="channel-tag">{tx.channel}</span>
                  </td>
                  <td>
                    <span
                      className={`country-tag ${tx.country?.toLowerCase() !== "india" ? "foreign" : ""}`}
                    >
                      {tx.country}{" "}
                      {tx.country?.toLowerCase() !== "india" ? "🌐" : ""}
                    </span>
                  </td>
                  <td>
                    <small>{tx.deviceId}</small>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center">
                    No transactions recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </section>
    </>
  );

  // =========================
  // ALERTS PAGE
  // =========================
  const AlertsPage = () => (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h3>🚨 Anti-Money Laundering Alerts</h3>
          <p>
            Rule triggers, network pattern escalations, and cross-border risk
            flags
          </p>
        </div>
        <button className="btn-primary" onClick={loadAlerts}>
          Refresh
        </button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Alert ID</th>
            <th>Tx ID</th>
            <th>Account</th>
            <th>Alert Type</th>
            <th>Risk Score</th>
            <th>Risk Level</th>
            <th>Status</th>
            <th>Created At</th>
            <th>Reason & Context</th>
          </tr>
        </thead>
        <tbody>
          {alerts.map((alert) => (
            <tr key={alert.id}>
              <td>
                <strong>#{alert.id}</strong>
              </td>
              <td>#{alert.transactionId}</td>
              <td>
                <span className="account-tag">{alert.accountId}</span>
              </td>
              <td>
                <span className="alert-type-tag">{alert.alertType}</span>
              </td>
              <td>
                <strong>{alert.riskScore}</strong>/100
              </td>
              <td>{getRiskBadge(alert.riskLevel)}</td>
              <td>
                <span className={`status-pill ${alert.status?.toLowerCase()}`}>
                  {alert.status}
                </span>
              </td>
              <td>
                <small>
                  {alert.createdAt
                    ? new Date(alert.createdAt).toLocaleString()
                    : "N/A"}
                </small>
              </td>
              <td className="description-cell">
                {alert.description || "Flagged by AML engine."}
              </td>
            </tr>
          ))}
          {alerts.length === 0 && (
            <tr>
              <td colSpan="9" className="text-center">
                No alerts logged.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );

  // =========================
  // CASES PAGE
  // =========================
  const CasesPage = () => (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h3>📁 AML Investigation Case Management</h3>
          <p>
            Cases auto-escalated from high-risk alerts and manual compliance
            inquiries
          </p>
        </div>
        <button className="btn-primary" onClick={loadCases}>
          Refresh
        </button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Case ID</th>
            <th>Alert ID</th>
            <th>Account</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Assigned To</th>
            <th>Remarks / Case Notes</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {cases.map((item) => (
            <tr key={item.id}>
              <td>
                <strong>#{item.id}</strong>
              </td>
              <td>{item.alertId ? `#${item.alertId}` : "Manual"}</td>
              <td>
                <span className="account-tag">{item.accountId}</span>
              </td>
              <td>{getRiskBadge(item.priority)}</td>
              <td>
                <span className={`status-pill ${item.status?.toLowerCase()}`}>
                  {item.status}
                </span>
              </td>
              <td>
                <span className="analyst-tag">{item.assignedTo}</span>
              </td>
              <td className="description-cell">{item.remarks}</td>
              <td>
                <div className="case-actions">
                  {item.status !== "INVESTIGATING" && (
                    <button
                      className="btn-sm btn-info"
                      onClick={() =>
                        handleUpdateCaseStatus(item.id, "INVESTIGATING")
                      }
                    >
                      Investigate
                    </button>
                  )}
                  {item.status !== "CLOSED" && (
                    <button
                      className="btn-sm btn-success"
                      onClick={() => handleUpdateCaseStatus(item.id, "CLOSED")}
                    >
                      Close
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {cases.length === 0 && (
            <tr>
              <td colSpan="8" className="text-center">
                No investigation cases logged.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );

  // =========================
  // NETWORK & ML PAGE
  // =========================
  const NetworkPage = () => {
    const graphWidth = 920;
    const graphHeight = 480;

    const getNodePosition = (index, total) => {
      const centerX = graphWidth / 2;
      const centerY = graphHeight / 2;
      if (total <= 1) return { x: centerX, y: centerY };

      const radius = Math.min(185, 95 + total * 14);
      const angle = (2 * Math.PI * index) / total - Math.PI / 2;
      return {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    };

    const getRiskClass = () => {
      if (!risk) return "low";
      if (risk.riskLevel === "HIGH") return "high";
      if (risk.riskLevel === "MEDIUM") return "medium";
      return "low";
    };

    return (
      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>🕸️ Transaction Graph Topology & ML Anomaly Surveillance</h3>
            <p>
              Powered by NetworkX graph algorithms and Scikit-learn Isolation
              Forest
            </p>
          </div>
          <button className="btn-primary" onClick={analyzeNetwork}>
            🔄 Re-Analyze Network
          </button>
        </div>

        {loadingNetwork && (
          <div className="no-data">
            Computing graph metrics & running ML anomaly detection...
          </div>
        )}

        {!loadingNetwork && networkAnalysis && (
          <>
            {/* TOPOLOGY SUMMARY CARDS */}
            <div className="network-summary">
              <div className="network-box">
                <span>Account Nodes</span>
                <strong>{network?.nodeCount || 0}</strong>
              </div>

              <div className="network-box">
                <span>Directed Edges</span>
                <strong>{network?.edgeCount || 0}</strong>
              </div>

              <div className="network-box">
                <span>Total Network Flow</span>
                <strong>
                  {formatAmount(
                    network?.edges?.reduce(
                      (t, e) => t + Number(e.amount || 0),
                      0,
                    ) || 0,
                  )}
                </strong>
              </div>

              <div className={`network-box risk-${getRiskClass()}`}>
                <span>Network Risk Score</span>
                <strong>{risk?.riskScore || 0}/100</strong>
              </div>

              <div className="network-box ml-box">
                <span>ML Anomaly Score</span>
                <strong>{mlAnomaly?.anomalyScore || 0}%</strong>
              </div>
            </div>

            {/* INTERACTIVE NETWORK VISUALIZATION */}
            <div className="network-graph-panel">
              <div className="graph-toolbar">
                <span className="legend-item">
                  <span className="dot dot-normal"></span> Normal Account
                </span>
                <span className="legend-item">
                  <span className="dot dot-cycle"></span> Circular Ring Node
                </span>
                <span className="legend-item">
                  <span className="dot dot-hub"></span> High-Degree Hub
                </span>
                <span className="legend-item">
                  <span className="line-legend line-cross"></span> Cross-Border
                  Flow
                </span>
              </div>

              <div className="network-graph">
                <svg
                  viewBox={`0 0 ${graphWidth} ${graphHeight}`}
                  width="100%"
                  height="480"
                >
                  <defs>
                    <marker
                      id="arrow"
                      markerWidth="10"
                      markerHeight="10"
                      refX="8"
                      refY="3"
                      orient="auto"
                    >
                      <path d="M0,0 L0,6 L9,3 z" fill="#2563eb" />
                    </marker>
                    <marker
                      id="arrow-foreign"
                      markerWidth="10"
                      markerHeight="10"
                      refX="8"
                      refY="3"
                      orient="auto"
                    >
                      <path d="M0,0 L0,6 L9,3 z" fill="#9333ea" />
                    </marker>
                  </defs>

                  {/* EDGES */}
                  {network?.edges?.map((edge, index) => {
                    const sourceIndex = network.nodes.findIndex(
                      (n) => n.id === edge.source,
                    );
                    const targetIndex = network.nodes.findIndex(
                      (n) => n.id === edge.target,
                    );
                    if (sourceIndex === -1 || targetIndex === -1) return null;

                    const source = getNodePosition(
                      sourceIndex,
                      network.nodes.length,
                    );
                    const target = getNodePosition(
                      targetIndex,
                      network.nodes.length,
                    );

                    const dx = target.x - source.x;
                    const dy = target.y - source.y;
                    const distance = Math.sqrt(dx * dx + dy * dy) || 1;

                    const nodeRadius = 42;
                    const startX = source.x + (dx / distance) * nodeRadius;
                    const startY = source.y + (dy / distance) * nodeRadius;
                    const endX = target.x - (dx / distance) * nodeRadius;
                    const endY = target.y - (dy / distance) * nodeRadius;

                    const isCross = edge.isCrossBorder;
                    const inCycle = edge.inCycle;

                    return (
                      <g key={index}>
                        <line
                          x1={startX}
                          y1={startY}
                          x2={endX}
                          y2={endY}
                          stroke={
                            isCross
                              ? "#9333ea"
                              : inCycle
                                ? "#ef4444"
                                : "#2563eb"
                          }
                          strokeWidth={inCycle || isCross ? "3.5" : "2"}
                          strokeDasharray={isCross ? "5,5" : undefined}
                          markerEnd={
                            isCross ? "url(#arrow-foreign)" : "url(#arrow)"
                          }
                        />
                        <rect
                          x={(source.x + target.x) / 2 - 55}
                          y={(source.y + target.y) / 2 - 16}
                          width="110"
                          height="22"
                          rx="6"
                          fill="#ffffff"
                          stroke={
                            isCross
                              ? "#9333ea"
                              : inCycle
                                ? "#ef4444"
                                : "#cbd5e1"
                          }
                        />
                        <text
                          x={(source.x + target.x) / 2}
                          y={(source.y + target.y) / 2 - 2}
                          textAnchor="middle"
                          className="graph-amount"
                        >
                          {formatAmount(edge.amount || 0)} {isCross ? "🌐" : ""}
                        </text>
                      </g>
                    );
                  })}

                  {/* NODES */}
                  {network?.nodes?.map((node, index) => {
                    const position = getNodePosition(
                      index,
                      network.nodes.length,
                    );
                    const isSelected = selectedNode?.id === node.id;
                    const inCycle = node.inCycle;
                    const isHub = node.isHighDegree;

                    return (
                      <g
                        key={node.id}
                        onClick={() => setSelectedNode(node)}
                        style={{ cursor: "pointer" }}
                      >
                        {/* OUTER HIGHLIGHT RING */}
                        {inCycle && (
                          <circle
                            cx={position.x}
                            cy={position.y}
                            r="48"
                            fill="none"
                            stroke="#ef4444"
                            strokeWidth="3"
                            strokeDasharray="4,4"
                            className="pulse-ring"
                          />
                        )}
                        {isHub && !inCycle && (
                          <circle
                            cx={position.x}
                            cy={position.y}
                            r="47"
                            fill="none"
                            stroke="#f59e0b"
                            strokeWidth="2.5"
                          />
                        )}

                        <circle
                          cx={position.x}
                          cy={position.y}
                          r="40"
                          fill={
                            inCycle
                              ? "#fee2e2"
                              : isSelected
                                ? "#dbeafe"
                                : "#f8fafc"
                          }
                          stroke={
                            inCycle ? "#ef4444" : isHub ? "#f59e0b" : "#2563eb"
                          }
                          strokeWidth={isSelected ? "4" : "2.5"}
                          className="graph-node"
                        />

                        <text
                          x={position.x}
                          y={position.y + 4}
                          textAnchor="middle"
                          className="graph-node-text"
                          fontWeight={isSelected ? "bold" : "normal"}
                        >
                          {node.id}
                        </text>

                        <text
                          x={position.x}
                          y={position.y + 58}
                          textAnchor="middle"
                          className="graph-connections"
                        >
                          {node.connections} links{" "}
                          {inCycle ? "• 🔄 Cycle" : isHub ? "• ★ Hub" : ""}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* NODE INSPECTOR DRAWER IF CLICKED */}
            {selectedNode && (
              <div className="selected-node-banner">
                <div>
                  <h4>
                    Account Topology Inspector:{" "}
                    <strong>{selectedNode.id}</strong>
                  </h4>
                  <div className="inspector-stats">
                    <span>
                      Total Links: <strong>{selectedNode.connections}</strong>
                    </span>
                    <span>
                      In-Degree: <strong>{selectedNode.inDegree || 0}</strong>
                    </span>
                    <span>
                      Out-Degree: <strong>{selectedNode.outDegree || 0}</strong>
                    </span>
                    <span>
                      Total Inflow:{" "}
                      <strong>
                        {formatAmount(selectedNode.totalInAmount)}
                      </strong>
                    </span>
                    <span>
                      Total Outflow:{" "}
                      <strong>
                        {formatAmount(selectedNode.totalOutAmount)}
                      </strong>
                    </span>
                    <span>
                      Circular Ring:{" "}
                      <strong>{selectedNode.inCycle ? "🚨 YES" : "NO"}</strong>
                    </span>
                  </div>
                </div>
                <button
                  className="btn-sm btn-info"
                  onClick={() => setSelectedNode(null)}
                >
                  Close
                </button>
              </div>
            )}

            {/* RISK & ML EXPLANATION PANEL */}
            <div className="grid">
              <div className={`panel risk-${getRiskClass()}`}>
                <h3>⚠️ Network Risk Factors & Detected Patterns</h3>
                <p>
                  <strong>Risk Level:</strong> {getRiskBadge(risk?.riskLevel)} |
                  Score: <strong>{risk?.riskScore}/100</strong>
                </p>

                {risk?.detectedPatterns?.length > 0 && (
                  <div className="pattern-tags-row">
                    {risk.detectedPatterns.map((p, i) => (
                      <span key={i} className="pattern-badge">
                        {p}
                      </span>
                    ))}
                  </div>
                )}

                <ul>
                  {risk?.reasons?.map((reason, index) => (
                    <li key={index}>
                      <strong>{reason}</strong>
                    </li>
                  ))}
                </ul>

                {network?.circularPatterns?.length > 0 && (
                  <div className="sub-pattern-box alert">
                    <strong>🔄 Circular Flow Loops Identified:</strong>
                    <ul>
                      {network.circularPatterns.map((cycle, i) => (
                        <li key={i}>
                          Cycle #{i + 1}: {cycle.join(" ➔ ")}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {network?.multiHopChains?.length > 0 && (
                  <div className="sub-pattern-box info">
                    <strong>⛓️ Layering Chains Detected:</strong>
                    <ul>
                      {network.multiHopChains.map((chain, i) => (
                        <li key={i}>
                          Chain #{i + 1}: {chain.join(" ➔ ")}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* ML ANOMALY DETECTION CARD */}
              <div className="panel ml-panel">
                <h3>🤖 Machine Learning Anomaly Detection</h3>
                <p>
                  <strong>Model:</strong>{" "}
                  {mlAnomaly?.modelStatus || "IsolationForest"}
                </p>
                <p>
                  <strong>Anomaly Severity:</strong>{" "}
                  <strong>{mlAnomaly?.anomalyScore || 0}%</strong>
                </p>
                <p>
                  <strong>Outliers Flagged:</strong>{" "}
                  {mlAnomaly?.anomalousCount || 0} transaction(s)
                </p>

                <strong>Feature Explanations:</strong>
                <ul>
                  {mlAnomaly?.reasons?.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* DETAILED NODES & EDGES TABLES */}
            <div className="panel">
              <h3>Network Nodes Summary</h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Account ID</th>
                    <th>Connections</th>
                    <th>Inflow Links</th>
                    <th>Outflow Links</th>
                    <th>Total Inflow</th>
                    <th>Total Outflow</th>
                    <th>Tags</th>
                  </tr>
                </thead>
                <tbody>
                  {network?.nodes?.map((n) => (
                    <tr key={n.id}>
                      <td>
                        <span className="account-tag">{n.id}</span>
                      </td>
                      <td>{n.connections}</td>
                      <td>{n.inDegree || 0}</td>
                      <td>{n.outDegree || 0}</td>
                      <td>{formatAmount(n.totalInAmount)}</td>
                      <td>{formatAmount(n.totalOutAmount)}</td>
                      <td>
                        {n.inCycle && (
                          <span className="badge badge-high">
                            CIRCULAR LOOP
                          </span>
                        )}
                        {n.isHighDegree && (
                          <span className="badge badge-medium">
                            HUB ACCOUNT
                          </span>
                        )}
                        {!n.inCycle && !n.isHighDegree && (
                          <span className="badge badge-low">STANDARD</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {!loadingNetwork && !networkAnalysis && (
          <div className="no-data">
            <p>No transaction network data available.</p>
            <button className="btn-primary" onClick={analyzeNetwork}>
              Analyze Network
            </button>
          </div>
        )}
      </section>
    );
  };

  // =========================
  // APP ROUTING
  // =========================
  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <Header />
        {activePage === "Dashboard" && <Dashboard />}
        {activePage === "Transactions" && <TransactionsPage />}
        {activePage === "Alerts" && <AlertsPage />}
        {activePage === "Cases" && <CasesPage />}
        {activePage === "Network" && <NetworkPage />}
      </main>
    </div>
  );
}

export default App;
