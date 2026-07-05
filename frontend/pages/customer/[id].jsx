import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Nav from "../../components/Nav";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const EVENT_META = {
  salary_hike:       { label: "Salary Hike",    color: "#22c55e", emoji: "📈" },
  city_relocation:   { label: "Relocation",     color: "#3b82f6", emoji: "🏙️" },
  new_emi_detected:  { label: "New EMI",        color: "#f59e0b", emoji: "🏠" },
  insurance_gap:     { label: "Insurance Gap",  color: "#ef4444", emoji: "🛡️" },
  marriage_detected: { label: "Marriage",       color: "#a855f7", emoji: "💍" },
  new_baby_detected: { label: "New Baby",       color: "#ec4899", emoji: "👶" },
};

const CAT_COLORS = {
  salary:"#22c55e", rent:"#3b82f6", grocery:"#f59e0b", emi:"#ef4444",
  shopping:"#a855f7", food:"#fb923c", medical:"#ec4899", baby:"#ec4899",
  wedding:"#8b5cf6", moving:"#0ea5e9", transport:"#64748b", education:"#06b6d4",
  travel:"#10b981", business:"#f97316", transfer:"#6366f1",
};

const TABS = [
  { id: "overview",     label: "Overview" },
  { id: "transactions", label: "Transactions" },
  { id: "signals",      label: "Agent Signals" },
  { id: "eligibility",  label: "Eligibility" },
  { id: "fraud",        label: "Fraud Gate" },
  { id: "clv",          label: "Lifetime Value" },
  { id: "deeplink",     label: "YONO Deeplink" },
];

export default function CustomerProfile() {
  const router = useRouter();
  const { id } = router.query;
  const [tab, setTab] = useState("overview");
  const [customer, setCustomer] = useState(null);
  const [detection, setDetection] = useState(null);
  const [behavior, setBehavior] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [fraud, setFraud] = useState(null);
  const [clv, setClv] = useState(null);
  const [deeplink, setDeeplink] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`${API}/api/customers/${id}`).then(r => r.json()),
      fetch(`${API}/api/agent/detect/${id}`).then(r => r.json()),
      fetch(`${API}/api/agent/behavior/${id}`).then(r => r.json()),
      fetch(`${API}/api/eligibility/${id}`).then(r => r.json()),
      fetch(`${API}/api/fraud/${id}`).then(r => r.json()),
      fetch(`${API}/api/clv/${id}`).then(r => r.json()),
      fetch(`${API}/api/deeplink/${id}`).then(r => r.json()),
    ]).then(([c, d, b, e, f, clvData, dl]) => {
      setCustomer(c); setDetection(d); setBehavior(b);
      setEligibility(e); setFraud(f); setClv(clvData); setDeeplink(dl);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  if (loading || !customer) return (
    <div style={{ minHeight: "100vh", background: "#0a0f1e", display: "flex", alignItems: "center", justifyContent: "center", color: "#475569", fontFamily: "Inter,sans-serif" }}>
      {loading ? "Loading 360° profile..." : "Customer not found"}
    </div>
  );

  const balances = customer.account_balance_history || [];
  const txns = customer.transactions || [];
  const signals = behavior?.signals || {};
  const scores = detection?.all_scores || {};
  const maxScore = Math.max(...Object.values(scores), 0.01);
  const evMeta = EVENT_META[detection?.top_event] || {};

  const byMonth = {};
  txns.forEach(t => {
    const m = t.date.slice(0, 7);
    if (!byMonth[m]) byMonth[m] = [];
    byMonth[m].push(t);
  });

  const catSpend = {};
  txns.filter(t => t.type === "debit").forEach(t => {
    catSpend[t.category] = (catSpend[t.category] || 0) + Math.abs(t.amount);
  });

  const GATE_COLOR = { SAFE: "#22c55e", SUSPICIOUS: "#f59e0b", BLOCKED: "#ef4444" };

  return (
    <>
      <Head><title>{customer.name} — SBI LifePulse 360°</title></Head>
      <div style={{ minHeight: "100vh", background: "#0a0f1e", fontFamily: "'Inter',sans-serif", color: "#e2e8f0" }}>
        <Nav subtitle="CUSTOMER 360°" />

        <div style={{ padding: "1.25rem 2rem", maxWidth: 1100, margin: "0 auto" }}>
          {/* Header */}
          <div style={{ display: "flex", gap: "1.25rem", alignItems: "flex-start", marginBottom: "1.25rem" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg,#1a56db,#0ea5e9)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
              {customer.name.charAt(0)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <h1 style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", margin: 0 }}>{customer.name}</h1>
                {detection?.top_event && (
                  <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 99, background: (evMeta.color||"#64748b") + "22", color: evMeta.color||"#64748b" }}>
                    {evMeta.emoji} {evMeta.label} · {Math.round((detection.confidence||0)*100)}%
                  </span>
                )}
                <span style={{ fontSize: 11, background: fraud?.gate === "SAFE" ? "#22c55e22" : "#ef444422", color: fraud?.gate === "SAFE" ? "#22c55e" : "#ef4444", padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>
                  {fraud?.gate === "SAFE" ? "✓ Fraud Clear" : "⚠ " + fraud?.gate}
                </span>
              </div>
              <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                {customer.city} · Age {customer.age} · {customer.profile?.occupation} · Credit {customer.profile?.credit_score}
              </div>
              <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>A/C: {customer.account_number}</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <a href={`/demo?customer=${id}`} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#25d366", color: "#fff", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>💬 Chat</a>
            </div>
          </div>

          {/* Tab nav */}
          <div style={{ display: "flex", gap: 2, borderBottom: "1px solid #1e2d4a", marginBottom: "1.25rem", overflowX: "auto" }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{ padding: "8px 14px", border: "none", borderBottom: `2px solid ${tab === t.id ? "#1a56db" : "transparent"}`, background: "transparent", color: tab === t.id ? "#60a5fa" : "#64748b", fontSize: 12, fontWeight: tab === t.id ? 600 : 400, cursor: "pointer", whiteSpace: "nowrap" }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Overview */}
          {tab === "overview" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 12, padding: "1.25rem" }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#f1f5f9", marginBottom: "1rem" }}>Balance History</div>
                <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 60, marginBottom: 8 }}>
                  {balances.map((b, i) => {
                    const maxB = Math.max(...balances.map(x => x.balance), 1);
                    return <div key={i} title={`₹${b.balance.toLocaleString()}`} style={{ flex: 1, background: i === balances.length-1 ? "#1a56db" : "#1e2d4a", borderRadius: 3, height: `${Math.max((b.balance/maxB)*100,8)}%` }} />;
                  })}
                </div>
                {balances.map((b, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: "#475569" }}>{b.month}</span>
                    <span style={{ color: "#f1f5f9", fontWeight: 600 }}>₹{(b.balance/1000).toFixed(0)}K</span>
                  </div>
                ))}
              </div>
              <div style={{ background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 12, padding: "1.25rem" }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#f1f5f9", marginBottom: "1rem" }}>Life Event + Recommendation</div>
                {detection && (
                  <>
                    <div style={{ padding: "10px", background: "#0a0f1e", borderRadius: 8, marginBottom: 10 }}>
                      <div style={{ fontSize: 11, color: "#475569" }}>Detected</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: evMeta.color||"#60a5fa", marginTop: 2 }}>{evMeta.emoji} {evMeta.label}</div>
                      <div style={{ fontSize: 12, color: "#22c55e", marginTop: 4 }}>{Math.round((detection.confidence||0)*100)}% confidence</div>
                    </div>
                    <div style={{ padding: "10px", background: "#0a0f1e", borderRadius: 8 }}>
                      <div style={{ fontSize: 11, color: "#475569" }}>Recommended Product</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#93c5fd", marginTop: 2 }}>{detection.recommended_product}</div>
                      <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>{detection.pitch_angle}</div>
                    </div>
                  </>
                )}
              </div>
              <div style={{ background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 12, padding: "1.25rem" }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#f1f5f9", marginBottom: "1rem" }}>Spending by Category</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  {Object.entries(catSpend).sort((a,b) => b[1]-a[1]).map(([cat, amt]) => (
                    <div key={cat} style={{ background: "#0a0f1e", borderRadius: 6, padding: "6px 8px", borderLeft: `3px solid ${CAT_COLORS[cat]||"#64748b"}` }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#f1f5f9" }}>₹{(amt/1000).toFixed(1)}K</div>
                      <div style={{ fontSize: 10, color: CAT_COLORS[cat]||"#64748b", textTransform: "capitalize" }}>{cat}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 12, padding: "1.25rem" }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#f1f5f9", marginBottom: "1rem" }}>Quick Stats</div>
                {[
                  { label: "5-Year CLV", value: clv ? `₹${(clv.clv_5_year/1000).toFixed(0)}K` : "—", color: "#22c55e" },
                  { label: "ROI on Outreach", value: clv ? `${(clv.cost_comparison?.roi_multiple||0).toLocaleString()}×` : "—", color: "#f59e0b" },
                  { label: "Fraud Score", value: fraud ? `${Math.round(fraud.fraud_score*100)}%` : "—", color: fraud?.gate === "SAFE" ? "#22c55e" : "#ef4444" },
                  { label: "Eligible Products", value: eligibility ? `${eligibility.eligible_count}/${eligibility.products?.length||0}` : "—", color: "#60a5fa" },
                ].map(item => (
                  <div key={item.label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #1e2d4a" }}>
                    <span style={{ fontSize: 12, color: "#64748b" }}>{item.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transactions */}
          {tab === "transactions" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {Object.entries(byMonth).sort().reverse().map(([month, mTxns]) => (
                <div key={month} style={{ background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 12, padding: "1.25rem" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>{month}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {mTxns.sort((a,b) => b.date.localeCompare(a.date)).map((t, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 10px", background: "#0a0f1e", borderRadius: 6 }}>
                        <div style={{ display: "flex", gap: 8, flex: 1 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: CAT_COLORS[t.category]||"#64748b", flexShrink: 0, marginTop: 5 }} />
                          <div>
                            <div style={{ fontSize: 12, color: "#e2e8f0" }}>{t.description.slice(0,50)}</div>
                            <div style={{ fontSize: 10, color: "#475569" }}>{t.date} · <span style={{ color: CAT_COLORS[t.category]||"#64748b" }}>{t.category}</span></div>
                          </div>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: t.type === "credit" ? "#22c55e" : "#94a3b8", whiteSpace: "nowrap", marginLeft: 12 }}>
                          {t.type === "credit" ? "+" : ""}₹{Math.abs(t.amount).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Agent Signals */}
          {tab === "signals" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
              <div style={{ background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 12, padding: "1.25rem" }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#f1f5f9", marginBottom: "1rem" }}>🔬 Behavioral Signals</div>
                {[
                  { label: "Salary Trend", value: `${signals.salary_trend_pct > 0 ? "+" : ""}${(signals.salary_trend_pct||0).toFixed(1)}%`, ok: signals.salary_trend_pct > 5 },
                  { label: "Location Change", value: signals.location_change_detected ? `✓ → ${signals.new_city}` : "Not detected", ok: signals.location_change_detected },
                  { label: "New EMI", value: signals.emi_detected ? `✓ ₹${(signals.emi_amount||0).toLocaleString()}/mo` : "Not detected", ok: signals.emi_detected },
                  { label: "Insurance Found", value: signals.insurance_premium_found ? "Found" : "❌ Not found", ok: !signals.insurance_premium_found },
                  { label: "Baby Spend", value: signals.baby_spend_detected ? `✓ ${signals.baby_spend_count} txns` : "Not detected", ok: signals.baby_spend_detected },
                  { label: "Wedding Spend", value: signals.wedding_spend_detected ? `✓ ${signals.wedding_spend_count} txns` : "Not detected", ok: signals.wedding_spend_detected },
                  { label: "Avg Balance", value: `₹${((signals.avg_monthly_balance||0)/1000).toFixed(0)}K`, ok: true },
                  { label: "Balance Trend", value: signals.balance_trend||"—", ok: signals.balance_trend === "growing" },
                ].map((row, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 8px", background: "#0a0f1e", borderRadius: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: "#64748b" }}>{row.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 500, color: row.ok ? "#22c55e" : "#94a3b8" }}>{row.value}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 12, padding: "1.25rem" }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#f1f5f9", marginBottom: "1rem" }}>🎯 Event Confidence Scores</div>
                {Object.entries(scores).sort((a,b) => b[1]-a[1]).map(([evt, score]) => {
                  const meta = EVENT_META[evt] || { label: evt, color: "#64748b", emoji: "·" };
                  const isTop = evt === detection?.top_event;
                  return (
                    <div key={evt} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: isTop ? meta.color : "#64748b", fontWeight: isTop ? 600 : 400 }}>
                          {meta.emoji} {meta.label} {isTop && "← Winner"}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: isTop ? meta.color : "#475569" }}>{Math.round(score*100)}%</span>
                      </div>
                      <div style={{ height: 6, background: "#1e2d4a", borderRadius: 3 }}>
                        <div style={{ height: "100%", width: `${(score/maxScore)*100}%`, background: isTop ? meta.color : "#2d3f5e", borderRadius: 3 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Eligibility */}
          {tab === "eligibility" && eligibility && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ background: "#0d1629", border: "1px solid #22c55e44", borderRadius: 12, padding: "1.25rem" }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#22c55e", marginBottom: "1rem" }}>✅ Eligible ({eligibility.eligible_count})</div>
                {eligibility.products?.filter(p => p.eligible).map(p => (
                  <div key={p.product_code} style={{ background: "#0a0f1e", borderRadius: 8, padding: "8px 12px", marginBottom: 6, borderLeft: "3px solid #22c55e" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>{p.product_name}</div>
                    <div style={{ fontSize: 10, color: "#334155", fontFamily: "monospace", marginTop: 2 }}>{p.product_code}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: "#0d1629", border: "1px solid #ef444444", borderRadius: 12, padding: "1.25rem" }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#ef4444", marginBottom: "1rem" }}>❌ Not Eligible ({(eligibility.products?.length||0) - (eligibility.eligible_count||0)})</div>
                {eligibility.products?.filter(p => !p.eligible).map(p => (
                  <div key={p.product_code} style={{ background: "#0a0f1e", borderRadius: 8, padding: "8px 12px", marginBottom: 6, borderLeft: "3px solid #ef4444" }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#f1f5f9", marginBottom: 4 }}>{p.product_name}</div>
                    {p.failures?.map((f, i) => <div key={i} style={{ fontSize: 11, color: "#ef4444" }}>→ {f}</div>)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fraud */}
          {tab === "fraud" && fraud && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ background: GATE_COLOR[fraud.gate] + "11", border: `1px solid ${GATE_COLOR[fraud.gate]}44`, borderRadius: 12, padding: "1.25rem" }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: GATE_COLOR[fraud.gate], marginBottom: 4 }}>
                  {fraud.gate === "SAFE" ? "✅" : fraud.gate === "SUSPICIOUS" ? "⚠️" : "🚫"} {fraud.gate}
                </div>
                <div style={{ fontSize: 13, color: "#94a3b8" }}>{fraud.reason}</div>
                <div style={{ fontSize: 12, color: GATE_COLOR[fraud.gate], marginTop: 8, fontWeight: 600 }}>→ {fraud.action}</div>
              </div>
              <div style={{ background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 12, padding: "1.25rem" }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#f1f5f9", marginBottom: "1rem" }}>
                  Fraud Score: {Math.round(fraud.fraud_score*100)}% · {fraud.flag_count} flag(s)
                </div>
                {fraud.flags?.length === 0 ? (
                  <div style={{ fontSize: 13, color: "#22c55e", textAlign: "center", padding: "1rem" }}>✅ No fraud signals detected</div>
                ) : fraud.flags?.map((f, i) => (
                  <div key={i} style={{ background: "#0a0f1e", borderRadius: 8, padding: "10px 12px", marginBottom: 8, borderLeft: `3px solid ${f.severity === "high" ? "#ef4444" : "#f59e0b"}` }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#f1f5f9" }}>{f.check?.replace(/_/g," ")}</div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>{f.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CLV */}
          {tab === "clv" && clv && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1rem" }}>
              {[
                { label: "5-Year CLV", value: `₹${(clv.clv_5_year||0).toLocaleString()}`, color: "#22c55e" },
                { label: "Lifetime CLV", value: `₹${(clv.clv_lifetime||0).toLocaleString()}`, color: "#60a5fa" },
                { label: "Annual Rev. Uplift", value: `₹${(clv.revenue_uplift_annual||0).toLocaleString()}`, color: "#f59e0b" },
                { label: "Customer Segment", value: clv.segment, color: clv.segment === "premium" ? "#22c55e" : "#60a5fa" },
                { label: "ROI on Pipeline", value: `${(clv.cost_comparison?.roi_multiple||0).toLocaleString()}×`, color: "#a78bfa" },
                { label: "Acquisition Cost", value: `₹${clv.cost_comparison?.lifepulse_acquisition_cost?.toFixed(2)||0}`, color: "#94a3b8" },
              ].map(item => (
                <div key={item.label} style={{ background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 10, padding: "1rem" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: item.color }}>{item.value}</div>
                  <div style={{ fontSize: 11, color: "#475569", marginTop: 3 }}>{item.label}</div>
                </div>
              ))}
              <div style={{ gridColumn: "1 / -1", background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 12, padding: "1.25rem" }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#f1f5f9", marginBottom: "1rem" }}>5-Year Revenue Breakdown</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {clv.yearly_breakdown?.map(yr => (
                    <div key={yr.year} style={{ flex: 1, background: "#0a0f1e", borderRadius: 8, padding: "8px", textAlign: "center" }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#60a5fa" }}>₹{(yr.revenue/1000).toFixed(0)}K</div>
                      <div style={{ fontSize: 10, color: "#475569" }}>Year {yr.year}</div>
                      <div style={{ fontSize: 10, color: "#334155", marginTop: 2 }}>{yr.retention_probability}% retention</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Deeplink */}
          {tab === "deeplink" && deeplink && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ background: "#0d1629", border: "1px solid #1a56db44", borderRadius: 12, padding: "1.25rem" }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#f1f5f9", marginBottom: "1rem" }}>📱 {deeplink.screen_title}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: "1rem" }}>
                  {deeplink.pre_filled_fields?.map((f, i) => (
                    <div key={i} style={{ fontSize: 13, color: "#22c55e" }}>✓ {f}</div>
                  ))}
                </div>
                <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: "1.25rem", lineHeight: 1.6 }}>{deeplink.one_tap_message}</div>
                <div style={{ background: "#0a0f1e", borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ fontSize: 11, color: "#475569", marginBottom: 4 }}>Web Fallback URL</div>
                  <div style={{ fontSize: 12, fontFamily: "monospace", color: "#93c5fd", wordBreak: "break-all" }}>{deeplink.web_fallback}</div>
                </div>
                <div style={{ background: "#0a0f1e", borderRadius: 8, padding: "10px 12px", marginTop: 8 }}>
                  <div style={{ fontSize: 11, color: "#475569", marginBottom: 4 }}>YONO Native Deeplink</div>
                  <div style={{ fontSize: 12, fontFamily: "monospace", color: "#a78bfa", wordBreak: "break-all" }}>{deeplink.yono_deeplink}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
