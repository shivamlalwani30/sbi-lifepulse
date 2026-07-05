import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import Nav from "../components/Nav";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ScalePage() {
  const [scale, setScale] = useState(null);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/scale`).then(r => r.json()).then(d => {
      setScale(d);
      setTimeout(() => setAnimated(true), 300);
    }).catch(console.error);
  }, []);

  const PHASES = [
    { phase: "Phase 1", timeline: "Month 0–6", base: "80M YONO Users", customers: "80L", events: "12L", enrolled: "96K", revenue: "₹40 Cr", color: "#3b82f6", status: "Launch Ready" },
    { phase: "Phase 2", timeline: "Month 6–12", base: "Digital Banking Users", customers: "150M", events: "2.25 Cr", enrolled: "18L", revenue: "₹756 Cr", color: "#a855f7", status: "Scale Up" },
    { phase: "Phase 3", timeline: "Year 2", base: "All SBI Customers", customers: "500M", events: "7.5 Cr", enrolled: "60L", revenue: "₹2,520 Cr", color: "#22c55e", status: "Full Scale" },
  ];

  const ARCH_LAYERS = [
    {
      label: "Data Layer",
      color: "#3b82f6",
      items: ["SBI Core Banking (Finacle)", "Transaction Streams (Kafka)", "Customer Profile DB (Oracle)", "YONO App Events"],
    },
    {
      label: "Agent Layer (LifePulse)",
      color: "#a855f7",
      items: ["Behavior Monitor Agent ×N", "Life Event Detector Agent ×N", "Personalization Agent (Claude)", "Conversational Close Agent (Claude)"],
    },
    {
      label: "Orchestration Layer",
      color: "#f59e0b",
      items: ["LangGraph Pipeline", "Redis Queue", "FastAPI Gateway", "Kubernetes HPA (auto-scale)"],
    },
    {
      label: "Engagement Layer",
      color: "#22c55e",
      items: ["WhatsApp Business API", "YONO In-App Push", "SMS Fallback", "Audit & Compliance Log"],
    },
  ];

  const NUMBERS = [
    { value: "500M+", label: "Total SBI Customers", sub: "Largest bank customer base in the world", color: "#60a5fa" },
    { value: "₹2,520 Cr", label: "Est. Annual Revenue Uplift", sub: "At Phase 3 scale, 8% conversion", color: "#22c55e" },
    { value: "175,000×", label: "ROI on API Cost", sub: "₹0.02 cost → ₹4,200 revenue per customer", color: "#f59e0b" },
    { value: "8 sec", label: "Per Customer Pipeline", sub: "From transaction scan to WhatsApp sent", color: "#a78bfa" },
    { value: "₹2 vs ₹250", label: "Digital vs Branch Cost", sub: "Per customer engagement", color: "#ec4899" },
    { value: "1.3 → 1.7", label: "Products per Customer", sub: "Year 1 uplift toward global best of 4.2", color: "#fb923c" },
  ];

  return (
    <>
      <Head><title>SBI LifePulse — Scale & Architecture</title></Head>
      <div style={{ minHeight: "100vh", background: "#0a0f1e", fontFamily: "'Inter', sans-serif", color: "#e2e8f0" }}>

        {/* Nav */}
        <nav style={{ background: "#0d1629", borderBottom: "1px solid #1e2d4a", padding: "0 1.5rem", height: 54, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18 }}>⚡</span>
            <span style={{ fontWeight: 700, color: "#fff" }}>SBI LifePulse</span>
            <span style={{ fontSize: 11, color: "#64748b" }}>/ Scale & Architecture</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Link href="/" style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #1e2d4a", background: "transparent", color: "#94a3b8", fontSize: 12, textDecoration: "none" }}>← Dashboard</Link>
            <Link href="/analytics" style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: "#1e2d4a", color: "#94a3b8", fontSize: 12, textDecoration: "none" }}>📊 Analytics</Link>
            <Link href="/demo" style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: "#1a56db", color: "#fff", fontSize: 12, textDecoration: "none", fontWeight: 500 }}>▶ Demo</Link>
          </div>
        </nav>

        <div style={{ padding: "2rem", maxWidth: 1100, margin: "0 auto" }}>

          {/* Hero statement */}
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <div style={{ fontSize: 13, color: "#1a56db", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Designed for SBI Scale from Day 1</div>
            <h1 style={{ fontSize: 34, fontWeight: 800, color: "#f1f5f9", margin: "0 0 12px", lineHeight: 1.2 }}>
              500 Million Customers.<br />
              <span style={{ background: "linear-gradient(135deg, #1a56db, #0ea5e9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>One Agentic Pipeline.</span>
            </h1>
            <p style={{ color: "#64748b", fontSize: 15, maxWidth: 560, margin: "0 auto" }}>
              LifePulse is stateless, horizontally scalable, and designed to plug directly into SBI's existing Finacle core banking stack.
            </p>
          </div>

          {/* Key numbers grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "2.5rem" }}>
            {NUMBERS.map((n, i) => (
              <div key={i} style={{ background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 12, padding: "1.25rem", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: n.color }} />
                <div style={{ fontSize: 28, fontWeight: 800, color: n.color, marginBottom: 4, fontVariantNumeric: "tabular-nums" }}>{n.value}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9", marginBottom: 3 }}>{n.label}</div>
                <div style={{ fontSize: 11, color: "#475569" }}>{n.sub}</div>
              </div>
            ))}
          </div>

          {/* Rollout Phases */}
          <div style={{ marginBottom: "2.5rem" }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#f1f5f9", marginBottom: "1.25rem" }}>🗺️ 3-Phase Rollout Plan</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
              {PHASES.map((p, i) => (
                <div key={i} style={{ background: "#0d1629", border: `1px solid ${p.color}44`, borderRadius: 12, padding: "1.25rem", position: "relative" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: p.color }}>{p.phase}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>{p.timeline}</div>
                    </div>
                    <span style={{ fontSize: 10, background: p.color + "22", color: p.color, padding: "2px 8px", borderRadius: 99, fontWeight: 600 }}>{p.status}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10 }}>Base: {p.base}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {[
                      { l: "Customers", v: p.customers },
                      { l: "Events Detected", v: p.events },
                      { l: "Enrolled", v: p.enrolled },
                      { l: "Revenue", v: p.revenue },
                    ].map(item => (
                      <div key={item.l} style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 12, color: "#64748b" }}>{item.l}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0" }}>{item.v}</span>
                      </div>
                    ))}
                  </div>
                  {i < 2 && (
                    <div style={{ position: "absolute", right: "-1rem", top: "50%", transform: "translateY(-50%)", fontSize: 16, color: "#334155", zIndex: 1 }}>→</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Architecture Stack */}
          <div style={{ marginBottom: "2.5rem" }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#f1f5f9", marginBottom: "1.25rem" }}>🏗️ Production Architecture</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {ARCH_LAYERS.map((layer, i) => (
                <div key={i} style={{ display: "flex", gap: 0 }}>
                  {/* Layer label */}
                  <div style={{ width: 180, flexShrink: 0, padding: "1rem", background: layer.color + "11", border: `1px solid ${layer.color}33`, borderRight: "none", borderBottom: i < ARCH_LAYERS.length - 1 ? "none" : undefined, borderRadius: i === 0 ? "10px 0 0 0" : i === ARCH_LAYERS.length - 1 ? "0 0 0 10px" : "0", display: "flex", alignItems: "center" }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: layer.color }}>{layer.label}</div>
                  </div>
                  {/* Items */}
                  <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0, border: `1px solid ${layer.color}33`, borderBottom: i < ARCH_LAYERS.length - 1 ? "none" : undefined, borderRadius: i === 0 ? "0 10px 0 0" : i === ARCH_LAYERS.length - 1 ? "0 0 10px 0" : "0" }}>
                    {layer.items.map((item, j) => (
                      <div key={j} style={{ padding: "0.85rem 1rem", borderLeft: j > 0 ? `1px solid ${layer.color}22` : "none", fontSize: 12, color: "#94a3b8", display: "flex", alignItems: "center" }}>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Scalability callouts */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
            {[
              { icon: "🔄", title: "Stateless Agents", body: "Each agent call is independent. No shared state means perfect horizontal scalability — add more pods, process more customers." },
              { icon: "📦", title: "Plugs into Finacle", body: "LifePulse reads from SBI's existing Finacle transaction API. No rip-and-replace. Deploy in weeks, not years." },
              { icon: "🛡️", title: "Built-in Compliance", body: "Every action logged. Consent checked before outreach. DPDP Act and RBI guidelines baked into the pipeline, not bolted on." },
            ].map((c, i) => (
              <div key={i} style={{ background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 12, padding: "1.25rem" }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{c.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#f1f5f9", marginBottom: 6 }}>{c.title}</div>
                <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>{c.body}</div>
              </div>
            ))}
          </div>

          {/* Closing line */}
          <div style={{ textAlign: "center", padding: "2rem", background: "linear-gradient(135deg, #0d1629, #0a1628)", border: "1px solid #1e2d4a", borderRadius: 14 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#f1f5f9", lineHeight: 1.5 }}>
              "LifePulse doesn't replace relationship banking —<br />
              <span style={{ background: "linear-gradient(135deg, #1a56db, #0ea5e9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                it makes it possible at 500 million relationships simultaneously."
              </span>
            </div>
            <div style={{ marginTop: 16 }}>
              <Link href="/demo" style={{ display: "inline-block", padding: "10px 28px", background: "linear-gradient(135deg, #1a56db, #0ea5e9)", borderRadius: 8, color: "#fff", textDecoration: "none", fontWeight: 600, fontSize: 14 }}>
                ▶ See It Live
              </Link>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
