import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import Nav from "../components/Nav";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [scale, setScale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scaleBase, setScaleBase] = useState(500000000);

  const fetchData = () => {
    Promise.all([
      fetch(`${API}/api/analytics`).then(r => r.json()),
      fetch(`${API}/api/scale`).then(r => r.json()),
    ]).then(([a, s]) => {
      setAnalytics(a);
      setScale(s);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const recalcScale = () => {
    fetch(`${API}/api/scale/custom`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer_base: scaleBase, conversion_rate: 0.08, event_detection_rate: 0.15 }),
    }).then(r => r.json()).then(setScale);
  };

  const EVENT_COLORS = {
    salary_hike: "#22c55e", city_relocation: "#3b82f6", new_emi_detected: "#f59e0b",
    insurance_gap: "#ef4444", marriage_detected: "#a855f7", new_baby_detected: "#ec4899", no_event: "#64748b",
  };
  const EVENT_LABELS = {
    salary_hike: "Salary Hike", city_relocation: "Relocation", new_emi_detected: "New EMI",
    insurance_gap: "Insurance Gap", marriage_detected: "Marriage", new_baby_detected: "New Baby",
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#0a0f1e", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontFamily: "Inter, sans-serif", fontSize: 14 }}>
      Loading analytics...
    </div>
  );

  const abStats = analytics?.ab_stats || {};
  const abVariants = Object.entries(abStats).filter(([k]) => k !== "_winner");
  const winner = abStats._winner;
  const funnel = analytics?.funnel || [];
  const maxFunnel = funnel[0]?.count || 1;
  const eventDist = analytics?.event_distribution || {};
  const totalEvents = Object.values(eventDist).reduce((a, b) => a + b, 0) || 1;

  return (
    <>
      <Head><title>SBI LifePulse — Analytics</title></Head>
      <div style={{ minHeight: "100vh", background: "#0a0f1e", fontFamily: "'Inter', sans-serif", color: "#e2e8f0" }}>

        {/* Nav */}
        <nav style={{ background: "#0d1629", borderBottom: "1px solid #1e2d4a", padding: "0 1.5rem", height: 54, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18 }}>⚡</span>
            <span style={{ fontWeight: 700, color: "#fff" }}>SBI LifePulse</span>
            <span style={{ fontSize: 11, color: "#64748b" }}>/ Analytics</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Link href="/" style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #1e2d4a", background: "transparent", color: "#94a3b8", fontSize: 12, textDecoration: "none" }}>← Dashboard</Link>
            <Link href="/demo" style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: "#1a56db", color: "#fff", fontSize: 12, textDecoration: "none", fontWeight: 500 }}>▶ Demo Mode</Link>
          </div>
        </nav>

        <div style={{ padding: "1.5rem 2rem", maxWidth: 1200, margin: "0 auto" }}>

          {/* Overview KPIs */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
            {[
              { label: "Customers", value: analytics?.overview?.total_customers || 0, color: "#60a5fa", fmt: "n" },
              { label: "Pipelines Run", value: analytics?.overview?.pipelines_run || 0, color: "#a78bfa", fmt: "n" },
              { label: "Enrolled", value: analytics?.overview?.enrolled || 0, color: "#22c55e", fmt: "n" },
              { label: "Conversion Rate", value: analytics?.overview?.conversion_rate_pct || 0, color: "#f59e0b", fmt: "pct" },
              { label: "Revenue Uplift (Est.)", value: analytics?.overview?.estimated_annual_revenue_uplift_rs || 0, color: "#ec4899", fmt: "inr" },
            ].map((kpi) => (
              <div key={kpi.label} style={{ background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 10, padding: "1rem 1.1rem" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: kpi.color }}>
                  {kpi.fmt === "pct" ? `${kpi.value}%` :
                   kpi.fmt === "inr" ? `₹${(kpi.value/1000).toFixed(0)}K` :
                   kpi.value.toLocaleString()}
                </div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>{kpi.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>

            {/* Conversion Funnel */}
            <div style={{ background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 12, padding: "1.25rem" }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: "#f1f5f9", marginBottom: "1.25rem" }}>📊 Conversion Funnel</div>
              {funnel.map((stage, i) => (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 13, color: "#94a3b8" }}>{stage.stage}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>{stage.count.toLocaleString()} <span style={{ color: "#64748b", fontWeight: 400 }}>({stage.pct}%)</span></span>
                  </div>
                  <div style={{ height: 8, background: "#1e2d4a", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(stage.count / maxFunnel) * 100}%`, background: i === 0 ? "#3b82f6" : i === 1 ? "#a78bfa" : i === 2 ? "#f59e0b" : "#22c55e", borderRadius: 4, transition: "width 0.8s ease" }} />
                  </div>
                </div>
              ))}
              {funnel.length === 0 && <div style={{ color: "#334155", fontSize: 13, textAlign: "center", paddingTop: "2rem" }}>Run pipelines on the dashboard to see funnel data</div>}
            </div>

            {/* Event Distribution */}
            <div style={{ background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 12, padding: "1.25rem" }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: "#f1f5f9", marginBottom: "1.25rem" }}>🎯 Life Event Distribution</div>
              {Object.entries(eventDist).length === 0 ? (
                <div style={{ color: "#334155", fontSize: 13, textAlign: "center", paddingTop: "2rem" }}>Run pipelines to see event distribution</div>
              ) : (
                Object.entries(eventDist).map(([evt, count]) => {
                  const pct = Math.round((count / totalEvents) * 100);
                  const color = EVENT_COLORS[evt] || "#64748b";
                  return (
                    <div key={evt} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color }}>● {EVENT_LABELS[evt] || evt}</span>
                        <span style={{ fontSize: 12, color: "#94a3b8" }}>{count} ({pct}%)</span>
                      </div>
                      <div style={{ height: 6, background: "#1e2d4a", borderRadius: 3 }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3 }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* A/B Testing Panel */}
          <div style={{ background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 12, padding: "1.25rem", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: "#f1f5f9" }}>🧪 A/B Message Testing</div>
              {winner && <span style={{ fontSize: 12, background: "#16a34a22", color: "#22c55e", padding: "3px 10px", borderRadius: 99, fontWeight: 600 }}>Variant {winner} is winning</span>}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
              {abVariants.map(([key, stat]) => (
                <div key={key} style={{ background: "#0a0f1e", border: `1px solid ${key === winner ? "#22c55e44" : "#1e2d4a"}`, borderRadius: 10, padding: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: key === winner ? "#22c55e" : "#60a5fa" }}>Variant {key}</div>
                    {key === winner && <span style={{ fontSize: 10, background: "#16a34a22", color: "#22c55e", padding: "2px 6px", borderRadius: 4, fontWeight: 600 }}>WINNER</span>}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10 }}>{stat.name}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {[
                      { label: "Sent", value: stat.total_sent },
                      { label: "Converted", value: stat.conversions },
                      { label: "Conv. Rate", value: `${stat.conversion_rate}%`, highlight: key === winner },
                      { label: "Avg Response", value: `${stat.avg_response_time_s}s` },
                    ].map((m) => (
                      <div key={m.label} style={{ background: "#0d1629", borderRadius: 6, padding: "6px 8px" }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: m.highlight ? "#22c55e" : "#f1f5f9" }}>{m.value}</div>
                        <div style={{ fontSize: 10, color: "#475569" }}>{m.label}</div>
                      </div>
                    ))}
                  </div>
                  {/* Conv rate bar */}
                  <div style={{ marginTop: 10 }}>
                    <div style={{ height: 4, background: "#1e2d4a", borderRadius: 2 }}>
                      <div style={{ height: "100%", width: `${Math.min(stat.conversion_rate * 1.5, 100)}%`, background: key === winner ? "#22c55e" : "#3b82f6", borderRadius: 2 }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Scale Impact Calculator */}
          <div style={{ background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 12, padding: "1.25rem" }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: "#f1f5f9", marginBottom: 4 }}>📐 SBI Scale Impact Calculator</div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: "1.25rem" }}>Adjust parameters to see real-world impact at SBI scale</div>

            {/* Slider */}
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: "1.25rem" }}>
              <label style={{ fontSize: 13, color: "#94a3b8", whiteSpace: "nowrap" }}>Customer Base:</label>
              <input
                type="range" min={1000000} max={500000000} step={1000000}
                value={scaleBase}
                onChange={(e) => setScaleBase(Number(e.target.value))}
                style={{ flex: 1, accentColor: "#1a56db" }}
              />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#60a5fa", minWidth: 80, textAlign: "right" }}>
                {scaleBase >= 10000000 ? `${(scaleBase/10000000).toFixed(0)}Cr` : `${(scaleBase/100000).toFixed(0)}L`}
              </span>
              <button onClick={recalcScale} style={{ padding: "6px 14px", borderRadius: 7, border: "none", background: "#1a56db", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                Recalculate
              </button>
            </div>

            {scale && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
                {[
                  { label: "Customers with Life Events", value: `${(scale.funnel.customers_with_detectable_event/100000).toFixed(0)}L`, sub: `${scale.input.event_detection_rate_pct}% detection rate`, color: "#a78bfa" },
                  { label: "Customers Enrolled", value: `${(scale.funnel.customers_enrolled/100000).toFixed(0)}L`, sub: `${scale.input.conversion_rate_pct}% conversion`, color: "#22c55e" },
                  { label: "Annual Revenue Uplift", value: `₹${scale.revenue.annual_uplift_cr}Cr`, sub: "@ ₹4,200 per product/yr", color: "#f59e0b" },
                  { label: "Net Benefit (Year 1)", value: `₹${scale.revenue.net_benefit_yr1_cr}Cr`, sub: `API cost: ₹${scale.revenue.total_api_cost_cr}Cr`, color: "#ec4899" },
                ].map((item) => (
                  <div key={item.label} style={{ background: "#0a0f1e", border: "1px solid #1e2d4a", borderRadius: 10, padding: "1rem" }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: item.color }}>{item.value}</div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: "#94a3b8", marginTop: 3 }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{item.sub}</div>
                  </div>
                ))}
              </div>
            )}

            {scale && (
              <div style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
                <div style={{ background: "#0a0f1e", border: "1px solid #1e2d4a", borderRadius: 10, padding: "1rem" }}>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>ROI Multiple</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "#22c55e" }}>{scale.unit_economics.roi_multiple}×</div>
                  <div style={{ fontSize: 11, color: "#475569" }}>Revenue per ₹1 spent on API</div>
                </div>
                <div style={{ background: "#0a0f1e", border: "1px solid #1e2d4a", borderRadius: 10, padding: "1rem" }}>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>Products/Customer (Year 1)</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "#60a5fa" }}>{scale.vs_current_state.lifepulse_products_per_customer_yr1}</div>
                  <div style={{ fontSize: 11, color: "#475569" }}>vs current 1.3 (global best: 4.2)</div>
                </div>
                <div style={{ background: "#0a0f1e", border: "1px solid #1e2d4a", borderRadius: 10, padding: "1rem" }}>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>Phase 1 (YONO Only)</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "#a78bfa" }}>₹{scale.phase1_yono.revenue_cr}Cr</div>
                  <div style={{ fontSize: 11, color: "#475569" }}>80M YONO users · 0–6 months</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
