import { useEffect, useState } from "react";
import axios from "axios";

import {
  PieChart,
  Pie,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import "./App.css";

function App() {
  const [activePage, setActivePage] = useState("Dashboard");

  // =========================
  // BACKEND DATA
  // =========================

  const [transactions, setTransactions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [cases, setCases] = useState([]);

  const [loadingTransactions, setLoadingTransactions] = useState(false);

  // =========================
  // NETWORK ANALYSIS
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
      const response = await axios.get(
        "http://localhost:8081/api/transactions",
      );

      setTransactions(response.data);
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
      const response = await axios.get("http://localhost:8083/api/aml/alerts");

      setAlerts(response.data);
    } catch (error) {
      console.error("Failed to load alerts:", error);
    }
  };

  // =========================
  // CASES
  // =========================

  const loadCases = async () => {
    try {
      const response = await axios.get("http://localhost:8083/api/cases");

      setCases(response.data);
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
      const response = await axios.post(
        "http://localhost:8004/api/network/analyze",
        transactions,
      );

      setNetworkAnalysis(response.data);

      console.log("Network analysis:", response.data);
    } catch (error) {
      console.error("Failed to analyze network:", error);

      setNetworkAnalysis(null);
    } finally {
      setLoadingNetwork(false);
    }
  };

  // =========================
  // CALCULATIONS
  // =========================

  const totalTransactions = transactions.length;

  const transactionVolume = transactions.reduce(
    (total, transaction) => total + Number(transaction.amount || 0),
    0,
  );

  const highRiskAlerts = alerts.filter(
    (alert) => alert.riskLevel === "HIGH",
  ).length;

  const openCases = cases.filter((item) => item.status === "OPEN").length;

  // =========================
  // RISK DATA
  // =========================

  const riskData = [
    {
      name: "Low",
      value: alerts.filter((alert) => alert.riskLevel === "LOW").length,
    },
    {
      name: "Medium",
      value: alerts.filter((alert) => alert.riskLevel === "MEDIUM").length,
    },
    {
      name: "High",
      value: alerts.filter((alert) => alert.riskLevel === "HIGH").length,
    },
  ];

  // =========================
  // TRANSACTION CHART
  // =========================

  const transactionChart = [
    {
      day: "Mon",
      transactions: 0,
    },
    {
      day: "Tue",
      transactions: 0,
    },
    {
      day: "Wed",
      transactions: 0,
    },
    {
      day: "Thu",
      transactions: 0,
    },
    {
      day: "Fri",
      transactions: 0,
    },
    {
      day: "Sat",
      transactions: 0,
    },
    {
      day: "Sun",
      transactions: 0,
    },
  ];

  // =========================
  // FORMAT MONEY
  // =========================

  const formatAmount = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // =========================
  // SIDEBAR
  // =========================

  const Sidebar = () => (
    <aside className="sidebar">
      <h2>AML Intelligence</h2>

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
        🕸️ Transaction Network
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

        <p>Anti-Money Laundering Network Intelligence</p>
      </div>

      <div className="user">👤 AML Analyst</div>
    </header>
  );

  // =========================
  // DASHBOARD
  // =========================

  const Dashboard = () => (
    <>
      <section className="cards">
        <div className="card">
          <span>Total Transactions</span>

          <strong>{totalTransactions}</strong>

          <small>From Transaction Service</small>
        </div>

        <div className="card">
          <span>Transaction Volume</span>

          <strong>{formatAmount(transactionVolume)}</strong>

          <small>Total processed value</small>
        </div>

        <div className="card danger">
          <span>High Risk Alerts</span>

          <strong>{highRiskAlerts}</strong>

          <small>Detected by AML engine</small>
        </div>

        <div className="card warning">
          <span>Open Cases</span>

          <strong>{openCases}</strong>

          <small>Requiring investigation</small>
        </div>
      </section>

      <section className="grid">
        <div className="panel">
          <h3>Transaction Activity</h3>

          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={transactionChart}>
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="day" />

              <YAxis />

              <Tooltip />

              <Bar dataKey="transactions" fill="#2563eb" />
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
                  outerRadius={90}
                  label
                />

                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data">No alert data available</div>
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h3>Recent AML Alerts</h3>

          <button onClick={loadAlerts}>Refresh</button>
        </div>

        <table>
          <thead>
            <tr>
              <th>Alert ID</th>

              <th>Account</th>

              <th>Alert Type</th>

              <th>Risk Score</th>

              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {alerts.map((alert) => (
              <tr key={alert.id}>
                <td>#{alert.id}</td>

                <td>{alert.accountId}</td>

                <td>{alert.alertType}</td>

                <td>{alert.riskScore}</td>

                <td>{alert.status}</td>
              </tr>
            ))}

            {alerts.length === 0 && (
              <tr>
                <td colSpan="5">No AML alerts found.</td>
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
    <section className="panel">
      <div className="panel-header">
        <h3>💳 Transaction Monitoring</h3>

        <button onClick={loadTransactions}>Refresh</button>
      </div>

      {loadingTransactions ? (
        <p>Loading transactions...</p>
      ) : (
        <table>
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
            {transactions.map((transaction) => (
              <tr key={transaction.id}>
                <td>#{transaction.id}</td>

                <td>{transaction.fromAccountId}</td>

                <td>{transaction.toAccountId}</td>

                <td>{formatAmount(transaction.amount || 0)}</td>

                <td>{transaction.currency}</td>

                <td>{transaction.channel}</td>

                <td>{transaction.country}</td>

                <td>{transaction.deviceId}</td>
              </tr>
            ))}

            {transactions.length === 0 && (
              <tr>
                <td colSpan="8">No transactions found.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </section>
  );

  // =========================
  // ALERTS PAGE
  // =========================

  const AlertsPage = () => (
    <section className="panel">
      <div className="panel-header">
        <h3>🚨 AML Alerts</h3>

        <button onClick={loadAlerts}>Refresh</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>ID</th>

            <th>Transaction</th>

            <th>Account</th>

            <th>Alert Type</th>

            <th>Risk Score</th>

            <th>Risk Level</th>

            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {alerts.map((alert) => (
            <tr key={alert.id}>
              <td>#{alert.id}</td>

              <td>{alert.transactionId}</td>

              <td>{alert.accountId}</td>

              <td>{alert.alertType}</td>

              <td>{alert.riskScore}</td>

              <td className="high">{alert.riskLevel}</td>

              <td>{alert.status}</td>
            </tr>
          ))}

          {alerts.length === 0 && (
            <tr>
              <td colSpan="7">No alerts available.</td>
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
        <h3>📁 Investigation Cases</h3>

        <button onClick={loadCases}>Refresh</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Case ID</th>

            <th>Alert ID</th>

            <th>Account</th>

            <th>Priority</th>

            <th>Status</th>

            <th>Assigned To</th>
          </tr>
        </thead>

        <tbody>
          {cases.map((item) => (
            <tr key={item.id}>
              <td>#{item.id}</td>

              <td>{item.alertId}</td>

              <td>{item.accountId}</td>

              <td>{item.priority}</td>

              <td>{item.status}</td>

              <td>{item.assignedTo}</td>
            </tr>
          ))}

          {cases.length === 0 && (
            <tr>
              <td colSpan="6">No investigation cases found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );

  // =========================
  // NETWORK PAGE
  // =========================

  const NetworkPage = () => {
    const network = networkAnalysis?.network;

    const risk = networkAnalysis?.risk;

    // SVG dimensions
    const graphWidth = 900;
    const graphHeight = 450;

    // Calculate position for every node
    const getNodePosition = (index, total) => {
      const centerX = graphWidth / 2;

      const centerY = graphHeight / 2;

      if (total === 1) {
        return {
          x: centerX,
          y: centerY,
        };
      }

      const radius = Math.min(170, 90 + total * 12);

      const angle = (2 * Math.PI * index) / total - Math.PI / 2;

      return {
        x: centerX + radius * Math.cos(angle),

        y: centerY + radius * Math.sin(angle),
      };
    };

    const getRiskClass = () => {
      if (!risk) {
        return "low";
      }

      if (risk.riskLevel === "HIGH") {
        return "high";
      }

      if (risk.riskLevel === "MEDIUM") {
        return "medium";
      }

      return "low";
    };

    return (
      <section className="panel">
        {/* HEADER */}

        <div className="panel-header">
          <div>
            <h3>🕸️ Transaction Network Intelligence</h3>

            <p>Network analysis powered by Python and NetworkX</p>
          </div>

          <button onClick={analyzeNetwork}>🔄 Analyze Network</button>
        </div>

        {/* LOADING */}

        {loadingNetwork && (
          <div className="no-data">Analyzing transaction network...</div>
        )}

        {/* NETWORK DATA */}

        {!loadingNetwork && networkAnalysis && (
          <>
            {/* =========================
                NETWORK SUMMARY
            ========================= */}

            <div className="network-summary">
              <div className="network-box">
                <span>Accounts</span>

                <strong>{network?.nodeCount || 0}</strong>
              </div>

              <div className="network-box">
                <span>Connections</span>

                <strong>{network?.edgeCount || 0}</strong>
              </div>

              <div className="network-box">
                <span>Total Value</span>

                <strong>
                  {formatAmount(
                    network?.edges?.reduce(
                      (total, edge) => total + Number(edge.amount || 0),
                      0,
                    ) || 0,
                  )}
                </strong>
              </div>

              <div className={`network-box risk-${getRiskClass()}`}>
                <span>Network Risk</span>

                <strong>
                  {risk?.riskScore || 0}
                  /100
                </strong>
              </div>
            </div>

            {/* =========================
                ACTUAL NETWORK GRAPH
            ========================= */}

            <div className="network-graph-panel">
              <h3>🔗 Transaction Relationship Graph</h3>

              <div className="network-graph">
                <svg
                  viewBox={`0 0 ${graphWidth} ${graphHeight}`}
                  width="100%"
                  height="450"
                >
                  {/* ARROW DEFINITION */}

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
                  </defs>

                  {/* =========================
                      TRANSACTION EDGES
                  ========================= */}

                  {network?.edges?.map((edge, index) => {
                    const sourceIndex = network.nodes.findIndex(
                      (node) => node.id === edge.source,
                    );

                    const targetIndex = network.nodes.findIndex(
                      (node) => node.id === edge.target,
                    );

                    const source = getNodePosition(
                      sourceIndex,
                      network.nodes.length,
                    );

                    const target = getNodePosition(
                      targetIndex,
                      network.nodes.length,
                    );

                    // Direction vector
                    const dx = target.x - source.x;

                    const dy = target.y - source.y;

                    const distance = Math.sqrt(dx * dx + dy * dy);

                    // Shorten line so it
                    // starts/ends at circles
                    const nodeRadius = 42;

                    const startX = source.x + (dx / distance) * nodeRadius;

                    const startY = source.y + (dy / distance) * nodeRadius;

                    const endX = target.x - (dx / distance) * nodeRadius;

                    const endY = target.y - (dy / distance) * nodeRadius;

                    return (
                      <g key={index}>
                        {/* LINE */}

                        <line
                          x1={startX}
                          y1={startY}
                          x2={endX}
                          y2={endY}
                          stroke="#2563eb"
                          strokeWidth="3"
                          markerEnd="url(#arrow)"
                        />

                        {/* TRANSACTION AMOUNT */}

                        <rect
                          x={(source.x + target.x) / 2 - 60}
                          y={(source.y + target.y) / 2 - 28}
                          width="120"
                          height="24"
                          rx="8"
                          fill="#ffffff"
                          stroke="#dbeafe"
                        />

                        <text
                          x={(source.x + target.x) / 2}
                          y={(source.y + target.y) / 2 - 11}
                          textAnchor="middle"
                          className="graph-amount"
                        >
                          {formatAmount(edge.amount || 0)}
                        </text>
                      </g>
                    );
                  })}

                  {/* =========================
                      NETWORK NODES
                  ========================= */}

                  {network?.nodes?.map((node, index) => {
                    const position = getNodePosition(
                      index,
                      network.nodes.length,
                    );

                    return (
                      <g key={node.id}>
                        {/* NODE CIRCLE */}

                        <circle
                          cx={position.x}
                          cy={position.y}
                          r="42"
                          className="graph-node"
                        />

                        {/* ACCOUNT ID */}

                        <text
                          x={position.x}
                          y={position.y + 5}
                          textAnchor="middle"
                          className="graph-node-text"
                        >
                          {node.id}
                        </text>

                        {/* CONNECTION COUNT */}

                        <text
                          x={position.x}
                          y={position.y + 65}
                          textAnchor="middle"
                          className="graph-connections"
                        >
                          {node.connections} connection(s)
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* =========================
                RISK ASSESSMENT
            ========================= */}

            <div className={`panel network-risk-panel risk-${getRiskClass()}`}>
              <h3>⚠️ Network Risk Assessment</h3>

              <p>
                <strong>Risk Level:</strong>{" "}
                <span className={`risk-text ${getRiskClass()}`}>
                  {risk?.riskLevel || "LOW"}
                </span>
              </p>

              <p>
                <strong>Risk Score:</strong> {risk?.riskScore || 0}
                /100
              </p>

              {risk?.reasons && risk.reasons.length > 0 ? (
                <>
                  <strong>Risk Factors:</strong>

                  <ul>
                    {risk.reasons.map((reason, index) => (
                      <li key={index}>{reason}</li>
                    ))}
                  </ul>
                </>
              ) : (
                <p>No significant network risk factors detected.</p>
              )}
            </div>

            {/* =========================
                CONNECTION LIST
            ========================= */}

            <div className="network-list">
              <h3>Transaction Connections</h3>

              {network?.edges?.length > 0 ? (
                network.edges.map((edge, index) => (
                  <div className="network-connection" key={index}>
                    <span>{edge.source}</span>

                    <b>→</b>

                    <span>{edge.target}</span>

                    <strong>{formatAmount(edge.amount || 0)}</strong>

                    <small>{edge.transactions} transaction(s)</small>
                  </div>
                ))
              ) : (
                <p>No connections found.</p>
              )}
            </div>

            {/* =========================
                NETWORK NODES TABLE
            ========================= */}

            <div className="panel">
              <h3>Network Nodes</h3>

              <table>
                <thead>
                  <tr>
                    <th>Account</th>

                    <th>Connections</th>
                  </tr>
                </thead>

                <tbody>
                  {network?.nodes?.map((node) => (
                    <tr key={node.id}>
                      <td>{node.id}</td>

                      <td>{node.connections}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* =========================
            NO DATA
        ========================= */}

        {!loadingNetwork && !networkAnalysis && (
          <div className="no-data">
            <p>No transaction network data available.</p>

            <button onClick={analyzeNetwork}>Analyze Network</button>
          </div>
        )}
      </section>
    );
  };

  // =========================
  // PAGE ROUTING
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
