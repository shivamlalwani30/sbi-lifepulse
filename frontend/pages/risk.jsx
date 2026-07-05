import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import Nav from "../components/Nav";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const PRIORITY_META = {
  urgent: { color: "#ef4444", bg: "#ef444422", label: "🚨 Urgent" },
  high:   { color: "#f59e0b", bg: "#f59e0b22", label: "🔥 High" },
  medium: { color: "#3b82f6", bg: "#3b82f622", label: "📋 Medium" },
  low:    { color: "#22c55e", bg: "#22c55e22", label: "✅ Low" },
};

const SCORE_COLOR = (v) =>
  v >= 0.65 ? "#ef4444" : v >= 0.35 ? "#f59e0b" : "#22c55e";

export default function RiskPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch(`${API}/api/risk`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const scores = data?.scores || [];
  const filtered = filter === "all" ? scores : scores.filter(s => s.overall_priority === filter);

  const urgentCount = scores.filter(s => s.overall_priority === "urgent").length;
  const highCount   = scores.filter(s => s.overall_priority === "high").length;

  const avgChurn   = scores.length ? (scores.reduce((a, s) => a + s.scores.churn_risk, 0) / scores.length).toFixed(2) : 0;
  const avgUpsell  = scores.length ? (scores.reduce((a, s) => a + s.scores.upsell_readiness, 0) / scores.length).toFixed(2) : 0;

  return (
    <>
      <Head><title>SBI LifePulse — Risk & Opportunity</title></Head>
      <div style={{ minHeight: "100vh", background: "#0a0f1e", fontFamily: "'Inter',sans-serif", color: "#e2e8f0" }}>
        <Nav subtitle="RISK & OPPORTUNITY" />

        <div style={{ padding: "1.5rem 2rem", maxWidth: 1100, margin: "0 auto" }}>

          <div style={{ marginBottom: "1.5rem" }}>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", margin: 0 }}>Risk & Opportunity Scoring</h1>
            <p style={{ color: "#475569", fontSize: 13, margin: "4px 0 0" }}>Runs alongside life event detection — gives sales teams a priority queue</p>
          </div>

          {/* KPI Row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
            {[
              { label: "Urgent (Churn Risk)", value: urgentCount, color: "#ef4444" },
              { label: "High Priority", value: highCount, color: "#f59e0b" },
              { label: "Avg Churn Risk", value: `${Math.round(avgChurn * 100)}%`, color: "#ef4444" },
              { label: "Avg Upsell Readiness", value: `${Math.round(avgUpsell * 100)}%`, color: "#22c55e" },
              { label: "Total Scored", value: scores.length, color: "#60a5fa" },
            ].map(k => (
              <div key={k.label} style={{ background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 10, padding: "1rem" }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: k.color }}>{k.value}</div>
                <div style={{ fontSize: 11, color: "#475569", marginTop: 3 }}>{k.label}</div>
              </div>
            ))}
          </div>

          {/* Filter tabs */}
          <div style={{ display: "flex", gap: 6, marginBottom: "1rem" }}>
            {["all", "urgent", "high", "medium", "low"].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ padding: "5px 14px", borderRadius: 6, border: "none", background: filter === f ? "#1a56db" : "#1e2d4a", color: filter === f ? "#fff" : "#64748b", fontSize: 12, fontWeight: filter === f ? 600 : 400, cursor: "pointer", textTransform: "capitalize" }}>
                {f === "all" ? `All (${scores.length})` : `${f} (${scores.filter(s => s.overall_priority === f).length})`}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ color: "#475569", textAlign: "center", padding: "3rem" }}>Loading risk scores...</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {filtered.map(score => {
                const pm = PRIORITY_META[score.overall_priority] || PRIORITY_META.low;
                return (
                  <div key={score.customer_id} style={{ background: "#0d1629", border: `1px solid ${pm.color}33`, borderRadius: 12, padding: "1rem 1.25rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <Link href={`/customer/${score.customer_id}`}
                          style={{ width: 36, height: 36, borderRadius: "50%", background: pm.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: pm.color, textDecoration: "none", flexShrink: 0 }}>
                          {score.customer_name.charAt(0)}
                        </Link>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14, color: "#f1f5f9" }}>{score.customer_name}</div>
                          <div style={{ fontSize: 11, color: "#475569" }}>
                            Age {score.profile_summary.age} · Credit {score.profile_summary.credit_score} · {score.profile_summary.existing_products} products · ₹{(score.profile_summary.avg_monthly_balance/1000).toFixed(0)}K avg balance
                          </div>
                        </div>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 99, background: pm.bg, color: pm.color }}>{pm.label}</span>
                    </div>

                    {/* Score bars */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
                      {[
                        { label: "Churn Risk", key: "churn_risk", invert: true },
                        { label: "Upsell Ready", key: "upsell_readiness", invert: false },
                        { label: "Credit Opp.", key: "credit_opportunity", invert: false },
                        { label: "Dormancy Risk", key: "dormancy_risk", invert: true },
                      ].map(metric => {
                        const val = score.scores[metric.key];
                        const col = metric.invert ? SCORE_COLOR(val) : (val >= 0.65 ? "#22c55e" : val >= 0.35 ? "#f59e0b" : "#64748b");
                        return (
                          <div key={metric.key}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                              <span style={{ fontSize: 11, color: "#64748b" }}>{metric.label}</span>
                              <span style={{ fontSize: 11, fontWeight: 700, color: col }}>{Math.round(val * 100)}%</span>
                            </div>
                            <div style={{ height: 5, background: "#1e2d4a", borderRadius: 3 }}>
                              <div style={{ height: "100%", width: `${val * 100}%`, background: col, borderRadius: 3 }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Actions */}
                    {score.recommended_actions.length > 0 && (
                      <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {score.recommended_actions.map((action, i) => (
                          <div key={i} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 99, background: action.priority === "URGENT" ? "#ef444422" : "#1e2d4a", color: action.priority === "URGENT" ? "#ef4444" : "#64748b", border: `1px solid ${action.priority === "URGENT" ? "#ef444444" : "#1e2d4a"}` }}>
                            → {action.action}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
