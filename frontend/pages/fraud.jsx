import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import Nav from "../components/Nav";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const GATE_META = {
  SAFE:       { color: "#22c55e", bg: "#16a34a22", icon: "✅", label: "SAFE — Clear to send" },
  SUSPICIOUS: { color: "#f59e0b", bg: "#f59e0b22", icon: "⚠️", label: "SUSPICIOUS — Review needed" },
  BLOCKED:    { color: "#ef4444", bg: "#dc262622", icon: "🚫", label: "BLOCKED — Do not send" },
};

const SEV_COLOR = { high: "#ef4444", medium: "#f59e0b", low: "#22c55e" };

export default function FraudPage() {
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/fraud`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const loadDetail = async (customerId) => {
    setSelected(customerId);
    const r = await fetch(`${API}/api/fraud/${customerId}`);
    const d = await r.json();
    setDetail(d);
  };

  const results = data?.results || [];

  return (
    <>
      <Head><title>SBI LifePulse — Fraud Detection</title></Head>
      <div style={{ minHeight: "100vh", background: "#0a0f1e", fontFamily: "'Inter',sans-serif", color: "#e2e8f0" }}>
        <Nav subtitle="FRAUD DETECTION" />

        <div style={{ padding: "1.5rem 2rem", maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ marginBottom: "1.5rem" }}>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", margin: 0 }}>Pre-Send Fraud Gate</h1>
            <p style={{ color: "#475569", fontSize: 13, margin: "4px 0 0" }}>
              Runs before every WhatsApp message is sent. If fraud signals detected, outreach is blocked automatically.
            </p>
          </div>

          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
            {[
              { label: "Total Customers", value: results.length, color: "#60a5fa" },
              { label: "Safe to Send", value: data?.safe || 0, color: "#22c55e" },
              { label: "Suspicious", value: data?.suspicious || 0, color: "#f59e0b" },
              { label: "Blocked", value: data?.blocked || 0, color: "#ef4444" },
            ].map(k => (
              <div key={k.label} style={{ background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 10, padding: "1rem" }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: k.color }}>{loading ? "—" : k.value}</div>
                <div style={{ fontSize: 11, color: "#475569", marginTop: 3 }}>{k.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            {/* Customer list */}
            <div style={{ background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 12, padding: "1.25rem" }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: "#f1f5f9", marginBottom: "1rem" }}>Customer Fraud Scores</div>
              {loading ? (
                <div style={{ color: "#475569", textAlign: "center", padding: "2rem" }}>Running fraud checks...</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {results.map(r => {
                    const gm = GATE_META[r.gate] || GATE_META.SAFE;
                    return (
                      <div key={r.customer_id} onClick={() => loadDetail(r.customer_id)}
                        style={{ padding: "10px 12px", background: selected === r.customer_id ? gm.bg : "#0a0f1e", border: `1px solid ${selected === r.customer_id ? gm.color + "44" : "#1e2d4a"}`, borderRadius: 9, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>{r.customer_name}</div>
                          <div style={{ fontSize: 11, color: "#475569" }}>{r.customer_id}</div>
                        </div>
                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 11, color: "#64748b" }}>Fraud score</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: r.fraud_score > 0.5 ? "#ef4444" : r.fraud_score > 0.2 ? "#f59e0b" : "#22c55e" }}>
                              {Math.round(r.fraud_score * 100)}%
                            </div>
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99, background: gm.bg, color: gm.color }}>
                            {gm.icon} {r.gate}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Detail panel */}
            <div style={{ background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 12, padding: "1.25rem" }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: "#f1f5f9", marginBottom: "1rem" }}>Fraud Analysis Detail</div>
              {!detail ? (
                <div style={{ color: "#334155", fontSize: 13, textAlign: "center", padding: "3rem 0" }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
                  Click a customer to see detailed fraud analysis
                </div>
              ) : (
                <>
                  {/* Gate banner */}
                  {(() => {
                    const gm = GATE_META[detail.gate] || GATE_META.SAFE;
                    return (
                      <div style={{ background: gm.bg, border: `1px solid ${gm.color}44`, borderRadius: 10, padding: "1rem", marginBottom: "1rem" }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: gm.color, marginBottom: 4 }}>{gm.icon} {gm.label}</div>
                        <div style={{ fontSize: 12, color: "#94a3b8" }}>{detail.reason}</div>
                        <div style={{ fontSize: 12, color: gm.color, marginTop: 6 }}>→ {detail.action}</div>
                      </div>
                    );
                  })()}

                  {/* Score breakdown */}
                  <div style={{ background: "#0a0f1e", borderRadius: 8, padding: "10px 12px", marginBottom: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: "#64748b" }}>Fraud Risk Score</span>
                      <span style={{ fontSize: 16, fontWeight: 800, color: detail.fraud_score > 0.5 ? "#ef4444" : detail.fraud_score > 0.2 ? "#f59e0b" : "#22c55e" }}>
                        {Math.round(detail.fraud_score * 100)}%
                      </span>
                    </div>
                    <div style={{ height: 8, background: "#1e2d4a", borderRadius: 4 }}>
                      <div style={{ height: "100%", width: `${detail.fraud_score * 100}%`, background: detail.fraud_score > 0.5 ? "#ef4444" : detail.fraud_score > 0.2 ? "#f59e0b" : "#22c55e", borderRadius: 4 }} />
                    </div>
                  </div>

                  {/* Flags */}
                  {detail.flags?.length > 0 ? (
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 8 }}>
                        {detail.flag_count} FLAG{detail.flag_count !== 1 ? "S" : ""} DETECTED
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {detail.flags.map((flag, i) => (
                          <div key={i} style={{ background: "#0a0f1e", borderRadius: 8, padding: "8px 12px", borderLeft: `3px solid ${SEV_COLOR[flag.severity] || "#64748b"}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                              <span style={{ fontSize: 12, fontWeight: 600, color: "#f1f5f9" }}>{flag.check?.replace(/_/g," ")}</span>
                              <span style={{ fontSize: 10, color: SEV_COLOR[flag.severity], fontWeight: 600, textTransform: "uppercase" }}>{flag.severity}</span>
                            </div>
                            <div style={{ fontSize: 11, color: "#64748b" }}>{flag.detail}</div>
                            <div style={{ fontSize: 10, color: "#334155", marginTop: 2 }}>{flag.transaction}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, color: "#22c55e", textAlign: "center", padding: "1rem" }}>
                      ✅ No fraud signals detected — safe to proceed
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* How it works */}
          <div style={{ background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 12, padding: "1.25rem", marginTop: "1.5rem" }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: "#f1f5f9", marginBottom: "1rem" }}>6 Fraud Detection Checks</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
              {[
                { title: "Large Non-Salary Credit", desc: "Credit >5× average salary from unknown source" },
                { title: "Rapid Large Debits", desc: ">4 debits above ₹20K in same month" },
                { title: "Balance Spike & Drain", desc: "Balance jumps 3×, then drained — mule pattern" },
                { title: "Transaction Velocity", desc: ">8 transactions in a single day" },
                { title: "Uniform Amounts", desc: "All transactions within 5% — bot pattern" },
                { title: "Salary Immediate Drain", desc: "Salary credited, >80% withdrawn same week" },
              ].map((c, i) => (
                <div key={i} style={{ background: "#0a0f1e", borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#f1f5f9", marginBottom: 4 }}>{i+1}. {c.title}</div>
                  <div style={{ fontSize: 11, color: "#475569", lineHeight: 1.5 }}>{c.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
