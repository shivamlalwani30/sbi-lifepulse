import { useState, useEffect } from "react";
import Head from "next/head";
import Nav from "../components/Nav";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function BusinessCasePage() {
  const [clvData, setClvData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("clv");

  useEffect(() => {
    fetch(`${API}/api/clv/portfolio`)
      .then(r => r.json())
      .then(d => { setClvData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const COMPETITORS = [
    {
      name: "Traditional Branch Model",
      approach: "Customer visits branch, requests product, officer manually processes",
      coverage: "~5M customers visited annually",
      cost: "₹250 per interaction",
      conversion: "~18%",
      life_events: "Not detected",
      personalization: "None",
      time_to_enroll: "3–7 days",
      color: "#ef4444",
      score: 2,
    },
    {
      name: "SBI Generic Alerts",
      approach: "Rule-based SMS/push — salary credit → generic cross-sell offer",
      coverage: "All YONO users (~80M)",
      cost: "₹0.20 per SMS",
      conversion: "~1.2%",
      life_events: "Salary only (rule-based)",
      personalization: "Name only",
      time_to_enroll: "1–3 days",
      color: "#f59e0b",
      score: 4,
    },
    {
      name: "Third-party Fintech CDP",
      approach: "Customer Data Platform aggregating signals, manual campaign setup",
      coverage: "Requires 6–12 month integration",
      cost: "₹8–15 Cr licensing",
      conversion: "~4–6%",
      life_events: "Partial",
      personalization: "Segment-level",
      time_to_enroll: "2–5 days",
      color: "#3b82f6",
      score: 6,
    },
    {
      name: "SBI LifePulse ⚡",
      approach: "5-agent AI pipeline — autonomous detection, personalization, enrollment",
      coverage: "All 500M customers (scalable)",
      cost: "₹0.02 per customer/run",
      conversion: "~8% (projected)",
      life_events: "6 types across 30+ cities",
      personalization: "Individual + regional language",
      time_to_enroll: "< 60 seconds",
      color: "#22c55e",
      score: 10,
    },
  ];

  const METRICS = ["coverage", "cost", "conversion", "life_events", "personalization", "time_to_enroll"];
  const METRIC_LABELS = {
    coverage: "Coverage", cost: "Cost/Interaction", conversion: "Conversion Rate",
    life_events: "Life Events", personalization: "Personalization", time_to_enroll: "Time to Enroll",
  };

  const clvList = clvData?.individual_clvs || [];
  const portfolio = clvData?.portfolio_summary || {};

  return (
    <>
      <Head><title>SBI LifePulse — Business Case</title></Head>
      <div style={{ minHeight: "100vh", background: "#0a0f1e", fontFamily: "'Inter',sans-serif", color: "#e2e8f0" }}>
        <Nav subtitle="BUSINESS CASE" />

        <div style={{ padding: "1.5rem 2rem", maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ marginBottom: "1.5rem" }}>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", margin: 0 }}>Business Case & Competitive Analysis</h1>
            <p style={{ color: "#475569", fontSize: 13, margin: "4px 0 0" }}>CLV projections + why LifePulse beats every alternative</p>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, marginBottom: "1.5rem" }}>
            {[{ id: "clv", label: "📈 Customer LTV" }, { id: "compare", label: "⚔️ Competitive Analysis" }].map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                style={{ padding: "7px 18px", borderRadius: 7, border: "none", background: activeTab === t.id ? "#1a56db" : "#1e2d4a", color: activeTab === t.id ? "#fff" : "#64748b", fontSize: 12, fontWeight: activeTab === t.id ? 600 : 400, cursor: "pointer" }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* CLV Tab */}
          {activeTab === "clv" && (
            <>
              {/* Portfolio KPIs */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
                {[
                  { label: "Portfolio 5-Year CLV", value: `₹${((portfolio.total_clv_5yr || 0)/1000).toFixed(0)}K`, sub: "across demo customers", color: "#22c55e" },
                  { label: "Avg CLV per Customer", value: `₹${((portfolio.avg_clv_5yr_per_customer || 0)/1000).toFixed(0)}K`, sub: "5-year horizon", color: "#60a5fa" },
                  { label: "ROI on Pipeline Cost", value: `${(portfolio.portfolio_roi || 0).toLocaleString()}×`, sub: "revenue vs ₹0.02 API cost", color: "#f59e0b" },
                  { label: "At SBI Scale (6M enrolled)", value: `₹${clvData?.scale_projection?.projected_5yr_clv_cr || 0} Cr`, sub: "5-year portfolio CLV", color: "#a78bfa" },
                ].map(k => (
                  <div key={k.label} style={{ background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 10, padding: "1rem" }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: k.color }}>{k.value}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", marginTop: 3 }}>{k.label}</div>
                    <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{k.sub}</div>
                  </div>
                ))}
              </div>

              {/* Individual CLV table */}
              {loading ? (
                <div style={{ color: "#475569", textAlign: "center", padding: "3rem" }}>Loading CLV data...</div>
              ) : (
                <div style={{ background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 12, padding: "1.25rem", overflowX: "auto" }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "#f1f5f9", marginBottom: "1rem" }}>Individual Customer LTV</div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #1e2d4a" }}>
                        {["Customer", "Segment", "Event", "Annual Rev Before", "Annual Rev After", "Uplift", "5-Yr CLV", "Lifetime CLV", "ROI"].map(h => (
                          <th key={h} style={{ textAlign: "left", padding: "7px 10px", color: "#64748b", fontWeight: 500, fontSize: 11, whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {clvList.map((c, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid #0a0f1e" }}>
                          <td style={{ padding: "9px 10px", color: "#e2e8f0", fontWeight: 500 }}>{c.customer_name}</td>
                          <td style={{ padding: "9px 10px" }}>
                            <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 99, background: c.segment === "premium" ? "#22c55e22" : c.segment === "standard" ? "#3b82f622" : "#ef444422", color: c.segment === "premium" ? "#22c55e" : c.segment === "standard" ? "#60a5fa" : "#ef4444" }}>{c.segment}</span>
                          </td>
                          <td style={{ padding: "9px 10px", color: "#93c5fd", fontSize: 11 }}>{c.event_type?.replace(/_/g," ")}</td>
                          <td style={{ padding: "9px 10px", color: "#64748b" }}>₹{(c.annual_revenue_before||0).toLocaleString()}</td>
                          <td style={{ padding: "9px 10px", color: "#e2e8f0" }}>₹{(c.annual_revenue_after||0).toLocaleString()}</td>
                          <td style={{ padding: "9px 10px", color: "#22c55e", fontWeight: 600 }}>+₹{(c.revenue_uplift_annual||0).toLocaleString()}</td>
                          <td style={{ padding: "9px 10px", fontWeight: 700, color: "#60a5fa" }}>₹{(c.clv_5_year||0).toLocaleString()}</td>
                          <td style={{ padding: "9px 10px", color: "#a78bfa" }}>₹{(c.clv_lifetime||0).toLocaleString()}</td>
                          <td style={{ padding: "9px 10px", color: "#f59e0b", fontWeight: 700 }}>{(c.cost_comparison?.roi_multiple||0).toLocaleString()}×</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* Comparison Tab */}
          {activeTab === "compare" && (
            <>
              {/* Score bars */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
                {COMPETITORS.map(c => (
                  <div key={c.name} style={{ background: "#0d1629", border: `1px solid ${c.color}44`, borderRadius: 12, padding: "1.25rem" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: c.color, marginBottom: 8 }}>{c.name}</div>
                    <div style={{ display: "flex", gap: 2, marginBottom: 8 }}>
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} style={{ flex: 1, height: 6, borderRadius: 2, background: i < c.score ? c.color : "#1e2d4a" }} />
                      ))}
                    </div>
                    <div style={{ fontSize: 11, color: "#475569" }}>Score: {c.score}/10</div>
                  </div>
                ))}
              </div>

              {/* Comparison table */}
              <div style={{ background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 12, padding: "1.25rem", overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #1e2d4a" }}>
                      <th style={{ textAlign: "left", padding: "8px 12px", color: "#64748b", fontWeight: 500, width: 140 }}>Metric</th>
                      {COMPETITORS.map(c => (
                        <th key={c.name} style={{ textAlign: "left", padding: "8px 12px", color: c.color, fontWeight: 600, fontSize: 11 }}>{c.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {METRICS.map(metric => (
                      <tr key={metric} style={{ borderBottom: "1px solid #0a0f1e" }}>
                        <td style={{ padding: "9px 12px", color: "#64748b", fontSize: 11, fontWeight: 600 }}>{METRIC_LABELS[metric]}</td>
                        {COMPETITORS.map(c => (
                          <td key={c.name} style={{ padding: "9px 12px", color: c.score === 10 ? "#22c55e" : "#94a3b8", fontWeight: c.score === 10 ? 600 : 400 }}>
                            {c[metric]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Closing argument */}
              <div style={{ background: "linear-gradient(135deg,#0d1629,#0a1628)", border: "1px solid #1e2d4a", borderRadius: 12, padding: "1.5rem", marginTop: "1.5rem", textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9", lineHeight: 1.6 }}>
                  LifePulse is the <span style={{ color: "#22c55e" }}>only solution</span> that combines<br />
                  real-time life event detection + regional language personalization +<br />
                  conversational enrollment — at <span style={{ color: "#f59e0b" }}>₹0.02 per customer</span>.
                </div>
                <div style={{ fontSize: 13, color: "#475569", marginTop: 10 }}>
                  No licensing fees. No branch visits. No human agents. Just results.
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
