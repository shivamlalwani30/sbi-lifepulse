import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import Nav from "../components/Nav";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function FeedbackPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/feedback/insights`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const refresh = () => {
    setLoading(true);
    fetch(`${API}/api/feedback/insights`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#0a0f1e", display: "flex", alignItems: "center", justifyContent: "center", color: "#475569", fontFamily: "Inter,sans-serif" }}>
      Loading feedback intelligence...
    </div>
  );

  const summary = data?.summary || {};
  const productPerf = data?.product_performance || {};
  const eventPerf = data?.event_performance || {};
  const cityPerf = data?.city_performance || {};
  const agePerf = data?.age_group_performance || {};
  const recs = data?.recommendations || [];
  const records = data?.raw_records || [];
  const adjustments = data?.confidence_adjustments || {};

  const EVENT_LABELS = {
    salary_hike: "Salary Hike 📈", city_relocation: "Relocation 🏙️",
    new_emi_detected: "New EMI 🏠", insurance_gap: "Insurance Gap 🛡️",
    marriage_detected: "Marriage 💍", new_baby_detected: "New Baby 👶",
  };
  const PRODUCT_SHORT = {
    SIP_2000: "SIP", CARD_UPGRADE: "Card Upgrade", TERM_PLAN: "Term Plan",
    LIFE_PROTECT: "Smart Protect", JOINT_ACC_HOMELOAN: "Joint+Home Loan", CHILD_PLAN: "Child Plan",
  };

  return (
    <>
      <Head><title>SBI LifePulse — Feedback Intelligence</title></Head>
      <div style={{ minHeight: "100vh", background: "#0a0f1e", fontFamily: "'Inter',sans-serif", color: "#e2e8f0" }}>

        <nav style={{ background: "#0d1629", borderBottom: "1px solid #1e2d4a", padding: "0 1.5rem", height: 54, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18 }}>⚡</span>
            <span style={{ fontWeight: 700, color: "#fff" }}>SBI LifePulse</span>
            <span style={{ fontSize: 11, color: "#64748b" }}>/ Feedback Intelligence</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={refresh} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #1e2d4a", background: "transparent", color: "#94a3b8", fontSize: 12, cursor: "pointer" }}>↺ Refresh</button>
            <Link href="/" style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #1e2d4a", background: "transparent", color: "#94a3b8", fontSize: 12, textDecoration: "none" }}>← Dashboard</Link>
          </div>
        </nav>

        <div style={{ padding: "1.5rem 2rem", maxWidth: 1100, margin: "0 auto" }}>

          {/* What is this */}
          <div style={{ background: "#0d1629", border: "1px solid #1a56db44", borderRadius: 12, padding: "1rem 1.25rem", marginBottom: "1.5rem", display: "flex", gap: 12, alignItems: "flex-start" }}>
            <span style={{ fontSize: 24 }}>🧠</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: "#60a5fa", marginBottom: 3 }}>Agent 5 — Feedback Loop Intelligence</div>
              <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>
                Every enrollment outcome trains the system. High-converting events get lower confidence thresholds (wider outreach). Low-converting events get higher thresholds (more selective). Over time, LifePulse learns which customers, cities, and life events convert best — without any manual tuning.
              </div>
            </div>
          </div>

          {/* KPIs */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
            {[
              { label: "Conversations", value: summary.total_conversations || 0, color: "#60a5fa" },
              { label: "Enrolled", value: summary.enrolled || 0, color: "#22c55e" },
              { label: "Opted Out", value: summary.opted_out || 0, color: "#ef4444" },
              { label: "Conversion Rate", value: `${summary.overall_conversion_rate || 0}%`, color: "#f59e0b" },
              { label: "Avg Turns to Close", value: summary.avg_conversation_turns || 0, color: "#a78bfa" },
            ].map(k => (
              <div key={k.label} style={{ background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 10, padding: "1rem" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: k.color }}>{k.value}</div>
                <div style={{ fontSize: 11, color: "#475569", marginTop: 3 }}>{k.label}</div>
              </div>
            ))}
          </div>

          {data?.records === 0 ? (
            <div style={{ background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 12, padding: "3rem", textAlign: "center", color: "#334155" }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🧠</div>
              <div style={{ fontSize: 14, color: "#475569" }}>No feedback data yet</div>
              <div style={{ fontSize: 12, marginTop: 6 }}>Complete some WhatsApp conversations to see Agent 5 learn</div>
            </div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>

                {/* Event performance */}
                <div style={{ background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 12, padding: "1.25rem" }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "#f1f5f9", marginBottom: "1rem" }}>🎯 Event Conversion Rates</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {Object.entries(eventPerf).sort((a,b) => b[1].conversion_rate - a[1].conversion_rate).map(([evt, stats]) => (
                      <div key={evt}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 12, color: "#94a3b8" }}>{EVENT_LABELS[evt] || evt}</span>
                          <div style={{ display: "flex", gap: 10 }}>
                            <span style={{ fontSize: 11, color: "#475569" }}>{stats.total} sent</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: stats.conversion_rate > 50 ? "#22c55e" : stats.conversion_rate > 30 ? "#f59e0b" : "#ef4444" }}>
                              {stats.conversion_rate}%
                            </span>
                          </div>
                        </div>
                        <div style={{ height: 6, background: "#1e2d4a", borderRadius: 3 }}>
                          <div style={{ height: "100%", width: `${stats.conversion_rate}%`, background: stats.conversion_rate > 50 ? "#22c55e" : stats.conversion_rate > 30 ? "#f59e0b" : "#ef4444", borderRadius: 3 }} />
                        </div>
                        {adjustments[evt] && (
                          <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>
                            Threshold auto-adjusted to {adjustments[evt]}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Product performance */}
                <div style={{ background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 12, padding: "1.25rem" }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "#f1f5f9", marginBottom: "1rem" }}>📦 Product Conversion Rates</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {Object.entries(productPerf).sort((a,b) => b[1].conversion_rate - a[1].conversion_rate).map(([code, stats]) => (
                      <div key={code}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 12, color: "#94a3b8" }}>{PRODUCT_SHORT[code] || code}</span>
                          <div style={{ display: "flex", gap: 10 }}>
                            <span style={{ fontSize: 11, color: "#475569" }}>{stats.enrolled}/{stats.total}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: stats.conversion_rate > 50 ? "#22c55e" : "#f59e0b" }}>
                              {stats.conversion_rate}%
                            </span>
                          </div>
                        </div>
                        <div style={{ height: 6, background: "#1e2d4a", borderRadius: 3 }}>
                          <div style={{ height: "100%", width: `${stats.conversion_rate}%`, background: "#a78bfa", borderRadius: 3 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* City + Age */}
                <div style={{ background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 12, padding: "1.25rem" }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "#f1f5f9", marginBottom: "1rem" }}>🏙️ City Performance</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {Object.entries(cityPerf).sort((a,b) => b[1].conversion_rate - a[1].conversion_rate).map(([city, stats]) => (
                      <div key={city} style={{ background: "#0a0f1e", borderRadius: 8, padding: "8px 10px" }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#f1f5f9" }}>{city}</div>
                        <div style={{ fontSize: 11, color: stats.conversion_rate > 60 ? "#22c55e" : "#f59e0b" }}>{stats.conversion_rate}% conv</div>
                        <div style={{ fontSize: 10, color: "#475569" }}>{stats.total} customers</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 12, padding: "1.25rem" }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "#f1f5f9", marginBottom: "1rem" }}>👥 Age Group Performance</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {Object.entries(agePerf).sort((a,b) => b[1].conversion_rate - a[1].conversion_rate).map(([age, stats]) => (
                      <div key={age}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                          <span style={{ fontSize: 12, color: "#94a3b8" }}>Age {age}</span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#60a5fa" }}>{stats.conversion_rate}%</span>
                        </div>
                        <div style={{ height: 5, background: "#1e2d4a", borderRadius: 3 }}>
                          <div style={{ height: "100%", width: `${stats.conversion_rate}%`, background: "#3b82f6", borderRadius: 3 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* AI Recommendations */}
              {recs.length > 0 && (
                <div style={{ background: "#0d1629", border: "1px solid #f59e0b44", borderRadius: 12, padding: "1.25rem", marginBottom: "1.5rem" }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "#f1f5f9", marginBottom: "1rem" }}>💡 Agent 5 Recommendations</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {recs.map((rec, i) => (
                      <div key={i} style={{ display: "flex", gap: 10, padding: "10px 12px", background: "#0a0f1e", borderRadius: 8, borderLeft: "3px solid #f59e0b" }}>
                        <span style={{ color: "#f59e0b", flexShrink: 0 }}>→</span>
                        <span style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.5 }}>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Raw records table */}
              <div style={{ background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 12, padding: "1.25rem" }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#f1f5f9", marginBottom: "1rem" }}>📋 Recent Conversations</div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #1e2d4a" }}>
                        {["Customer","Event","Product","Turns","Variant","City","Outcome"].map(h => (
                          <th key={h} style={{ textAlign: "left", padding: "6px 10px", color: "#64748b", fontWeight: 500, fontSize: 11 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((r, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid #0a0f1e" }}>
                          <td style={{ padding: "8px 10px", color: "#e2e8f0" }}>{r.customer_name}</td>
                          <td style={{ padding: "8px 10px", color: "#93c5fd" }}>{EVENT_LABELS[r.event_type]?.split(" ")[0] || r.event_type}</td>
                          <td style={{ padding: "8px 10px", color: "#c4b5fd" }}>{PRODUCT_SHORT[r.product_code] || r.product_code}</td>
                          <td style={{ padding: "8px 10px", color: "#64748b", textAlign: "center" }}>{r.turns}</td>
                          <td style={{ padding: "8px 10px", color: "#60a5fa", textAlign: "center" }}>{r.variant}</td>
                          <td style={{ padding: "8px 10px", color: "#64748b" }}>{r.city}</td>
                          <td style={{ padding: "8px 10px" }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: r.enrolled ? "#22c55e" : "#ef4444", background: r.enrolled ? "#16a34a22" : "#dc262622", padding: "2px 8px", borderRadius: 99 }}>
                              {r.enrolled ? "Enrolled" : "Opted Out"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
