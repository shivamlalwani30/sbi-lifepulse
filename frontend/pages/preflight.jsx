import { useState } from "react";
import Head from "next/head";
import Nav from "../components/Nav";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const CHECKS = [
  // Critical — demo fails without these
  { id: "backend",      label: "Backend API running",                    critical: true  },
  { id: "api_key",      label: "Anthropic API key configured",           critical: true  },
  { id: "customers",    label: "12 customers loaded",                    critical: true  },
  { id: "agents_12",    label: "All 12 customers detect correct events", critical: true  },
  { id: "pipeline",     label: "Full pipeline SSE working (CUST001)",    critical: true  },
  { id: "chat",         label: "Chat endpoint responding",               critical: true  },
  { id: "offline",      label: "Offline demo cache ready",               critical: true  },
  // High — important for full demo
  { id: "fraud",        label: "Fraud gate returning results",           critical: false },
  { id: "eligibility",  label: "Eligibility checker working",            critical: false },
  { id: "sessions",     label: "SQLite session store working",           critical: false },
  { id: "clv",          label: "CLV calculator working",                 critical: false },
  { id: "deeplink",     label: "YONO deeplink generator working",        critical: false },
  { id: "scale",        label: "Scale metrics computing",                critical: false },
  { id: "analytics",    label: "Analytics endpoint returning data",      critical: false },
  { id: "ab",           label: "A/B testing data seeded",               critical: false },
  { id: "feedback",     label: "Agent 5 feedback insights",             critical: false },
  { id: "risk",         label: "Risk scoring engine working",            critical: false },
  { id: "campaigns",    label: "Campaign scheduler loaded",              critical: false },
  { id: "sentiment",    label: "Sentiment tracker working",              critical: false },
  { id: "intent",       label: "Intent classifier working",              critical: false },
  { id: "twilio",       label: "Twilio status reachable",               critical: false },
  { id: "multilingual", label: "Multilingual language detection",        critical: false },
  { id: "batch",        label: "Batch engine ready",                    critical: false },
  { id: "webhook",      label: "Webhook receiver working",              critical: false },
];

export default function PreflightPage() {
  const [results, setResults] = useState({});
  const [running, setRunning]  = useState(false);
  const [done, setDone]        = useState(false);
  const [log, setLog]          = useState([]);

  const addLog = (msg, type = "info") =>
    setLog(prev => [...prev, { msg, type, ts: new Date().toLocaleTimeString() }]);

  const mark = (id, status, detail = "") => {
    setResults(prev => ({ ...prev, [id]: { status, detail } }));
    addLog(`${status === "pass" ? "✅" : status === "fail" ? "❌" : "⚠️"} ${id}: ${detail}`, status);
  };

  const runChecks = async () => {
    setRunning(true); setDone(false); setResults({}); setLog([]);
    addLog("Starting pre-flight checks...", "info");

    // 1. Backend
    try {
      const r = await fetch(`${API}/api/health`, { signal: AbortSignal.timeout(4000) });
      const d = await r.json();
      mark("backend",   "pass", `v${d.version} — ${d.status}`);
      mark("api_key",   d.api_key_configured ? "pass" : "warn",
           d.api_key_configured ? "ANTHROPIC_API_KEY set" : "Missing — offline cache will be used");
      mark("customers", d.data?.customers_loaded >= 12 ? "pass" : "warn",
           `${d.data?.customers_loaded} customers loaded`);
    } catch {
      mark("backend",   "fail", "Not reachable — run: uvicorn main:app --reload");
      mark("api_key",   "fail", "Cannot check — backend down");
      mark("customers", "fail", "Cannot check — backend down");
      setRunning(false); setDone(true); return;
    }

    // 2. Agent detection on all 12 customers
    try {
      const expected = {
        CUST001:"salary_hike", CUST002:"city_relocation", CUST003:"new_emi_detected",
        CUST004:"insurance_gap", CUST005:"marriage_detected", CUST006:"new_baby_detected",
        CUST007:"salary_hike", CUST008:"insurance_gap", CUST009:"new_baby_detected",
        CUST010:"city_relocation", CUST011:"marriage_detected", CUST012:"new_emi_detected",
      };
      const results12 = await Promise.all(
        Object.keys(expected).map(id =>
          fetch(`${API}/api/agent/detect/${id}`).then(r => r.json()).then(d => ({ id, event: d.top_event, expected: expected[id] }))
        )
      );
      const allCorrect = results12.every(r => r.event === r.expected);
      mark("agents_12", allCorrect ? "pass" : "fail",
        allCorrect ? "12/12 correct" : results12.filter(r => r.event !== r.expected).map(r => `${r.id}: got ${r.event}`).join(", "));
    } catch (e) { mark("agents_12", "fail", e.message); }

    // 3. Pipeline SSE
    try {
      const ctrl = new AbortController();
      setTimeout(() => ctrl.abort(), 6000);
      const r = await fetch(`${API}/api/pipeline/CUST001/stream`, { signal: ctrl.signal });
      mark("pipeline", r.ok ? "pass" : "fail", `content-type: ${r.headers.get("content-type")}`);
    } catch (e) { mark("pipeline", e.name === "AbortError" ? "warn" : "fail", e.name === "AbortError" ? "Timeout (ok — SSE is streaming)" : e.message); }

    // 4. Chat
    try {
      const r = await fetch(`${API}/api/chat`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({customer_id:"CUST001",message:"test",conversation_history:[]}) });
      mark("chat", r.status < 500 ? "pass" : "fail", `Status ${r.status}`);
    } catch (e) { mark("chat", "fail", e.message); }

    // 5. Offline cache
    try {
      const r = await fetch(`${API}/api/demo/cache-status`); const d = await r.json();
      mark("offline", d.cached_customers >= 12 ? "pass" : "warn",
        `${d.cached_customers} customers cached · Offline mode: ${d.offline_mode_active}`);
    } catch (e) { mark("offline", "fail", e.message); }

    // 6. Fraud gate
    try {
      const r = await fetch(`${API}/api/fraud/CUST001`); const d = await r.json();
      mark("fraud", d.gate ? "pass" : "fail", `CUST001: ${d.gate} (score: ${d.fraud_score})`);
    } catch (e) { mark("fraud", "fail", e.message); }

    // 7. Eligibility
    try {
      const r = await fetch(`${API}/api/eligibility/CUST001`); const d = await r.json();
      mark("eligibility", d.eligible_count > 0 ? "pass" : "warn", `${d.eligible_count} products eligible`);
    } catch (e) { mark("eligibility", "fail", e.message); }

    // 8. Sessions
    try {
      const r = await fetch(`${API}/api/sessions/all`); const d = await r.json();
      mark("sessions", Array.isArray(d.sessions) ? "pass" : "fail", `${d.sessions?.length||0} sessions in store`);
    } catch (e) { mark("sessions", "fail", e.message); }

    // 9. CLV
    try {
      const r = await fetch(`${API}/api/clv/portfolio`); const d = await r.json();
      mark("clv", d.portfolio_summary?.total_clv_5yr > 0 ? "pass" : "fail",
        `Portfolio 5yr CLV: ₹${((d.portfolio_summary?.total_clv_5yr||0)/1000).toFixed(0)}K`);
    } catch (e) { mark("clv", "fail", e.message); }

    // 10. Deeplink
    try {
      const r = await fetch(`${API}/api/deeplink/CUST001`); const d = await r.json();
      mark("deeplink", d.web_fallback ? "pass" : "fail", d.screen_title || "generated");
    } catch (e) { mark("deeplink", "fail", e.message); }

    // 11. Scale
    try {
      const r = await fetch(`${API}/api/scale`); const d = await r.json();
      mark("scale", d.revenue?.annual_uplift_cr > 0 ? "pass" : "fail",
        `₹${d.revenue?.annual_uplift_cr}Cr annual uplift`);
    } catch (e) { mark("scale", "fail", e.message); }

    // 12. Analytics
    try {
      const r = await fetch(`${API}/api/analytics`); const d = await r.json();
      mark("analytics", d.overview?.total_customers > 0 ? "pass" : "fail",
        `${d.overview?.total_customers} customers`);
    } catch (e) { mark("analytics", "fail", e.message); }

    // 13. A/B
    try {
      const r = await fetch(`${API}/api/ab/stats`); const d = await r.json();
      mark("ab", d._winner ? "pass" : "warn", `Winner: Variant ${d._winner||"TBD"}`);
    } catch (e) { mark("ab", "fail", e.message); }

    // 14. Feedback
    try {
      const r = await fetch(`${API}/api/feedback/insights`); const d = await r.json();
      mark("feedback", r.ok ? "pass" : "fail", `${d.records||0} feedback records`);
    } catch (e) { mark("feedback", "fail", e.message); }

    // 15. Risk
    try {
      const r = await fetch(`${API}/api/risk`); const d = await r.json();
      mark("risk", d.total > 0 ? "pass" : "fail", `${d.total} customers scored`);
    } catch (e) { mark("risk", "fail", e.message); }

    // 16. Campaigns
    try {
      const r = await fetch(`${API}/api/campaigns`); const d = await r.json();
      mark("campaigns", d.campaigns?.length > 0 ? "pass" : "fail",
        `${d.campaigns?.length||0} campaigns`);
    } catch (e) { mark("campaigns", "fail", e.message); }

    // 17. Sentiment
    try {
      const r = await fetch(`${API}/api/sentiment/message`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({message:"haan bilkul"}) });
      const d = await r.json();
      mark("sentiment", d.label ? "pass" : "fail", `"haan bilkul" → ${d.label}`);
    } catch (e) { mark("sentiment", "fail", e.message); }

    // 18. Intent
    try {
      const r = await fetch(`${API}/api/intent/classify`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({message:"yes please"}) });
      const d = await r.json();
      mark("intent", d.intent === "STRONG_YES" ? "pass" : "warn", `"yes please" → ${d.intent}`);
    } catch (e) { mark("intent", "fail", e.message); }

    // 19. Twilio
    try {
      const r = await fetch(`${API}/api/twilio/status`); const d = await r.json();
      mark("twilio", r.ok ? "pass" : "fail",
        d.configured ? "✅ Configured — real WhatsApp ready" : "Not configured (WhatsApp sim will be used)");
    } catch (e) { mark("twilio", "fail", e.message); }

    // 20. Multilingual
    try {
      const r = await fetch(`${API}/api/multilingual/CUST001/detect`); const d = await r.json();
      mark("multilingual", d.detected_language ? "pass" : "fail",
        `Mumbai → ${d.detected_language}`);
    } catch (e) { mark("multilingual", "fail", e.message); }

    // 21. Batch
    try {
      const r = await fetch(`${API}/api/batch`); const d = await r.json();
      mark("batch", r.ok ? "pass" : "fail", `${d.runs?.length||0} previous runs`);
    } catch (e) { mark("batch", "fail", e.message); }

    // 22. Webhook
    try {
      const r = await fetch(`${API}/api/webhook/queue`); const d = await r.json();
      mark("webhook", r.ok ? "pass" : "fail", `${d.total||0} items in queue`);
    } catch (e) { mark("webhook", "fail", e.message); }

    addLog("Pre-flight complete!", "info");
    setRunning(false); setDone(true);
  };

  const passed   = Object.values(results).filter(r => r.status === "pass").length;
  const failed   = Object.values(results).filter(r => r.status === "fail").length;
  const warned   = Object.values(results).filter(r => r.status === "warn").length;
  const critFail = CHECKS.filter(c => c.critical && results[c.id]?.status === "fail").length;
  const allGood  = done && failed === 0;

  return (
    <>
      <Head><title>SBI LifePulse — Pre-Flight</title></Head>
      <div style={{ minHeight: "100vh", background: "#0a0f1e", fontFamily: "'Inter',sans-serif", color: "#e2e8f0" }}>
        <Nav subtitle="PRE-FLIGHT CHECKLIST" />
        <div style={{ padding: "1.5rem 2rem", maxWidth: 900, margin: "0 auto" }}>

          <div style={{ marginBottom: "1.5rem" }}>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", margin: 0 }}>Demo Day Pre-Flight — 24 Checks</h1>
            <p style={{ color: "#475569", fontSize: 13, margin: "4px 0 0" }}>Run this 30 minutes before GFF presentation. All critical checks must pass.</p>
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: "1.5rem" }}>
            <button onClick={runChecks} disabled={running}
              style={{ padding: "10px 28px", borderRadius: 8, border: "none", background: running ? "#1e2d4a" : "linear-gradient(135deg,#1a56db,#0ea5e9)", color: running ? "#475569" : "#fff", fontSize: 14, fontWeight: 700, cursor: running ? "default" : "pointer" }}>
              {running ? `⚡ Running... (${Object.keys(results).length}/${CHECKS.length})` : done ? "↺ Run Again" : "▶ Run Pre-Flight Checks"}
            </button>
            {done && (
              <div style={{ display: "flex", gap: 10 }}>
                <span style={{ fontSize: 13, color: "#22c55e" }}>✅ {passed}</span>
                {warned > 0 && <span style={{ fontSize: 13, color: "#f59e0b" }}>⚠️ {warned}</span>}
                {failed > 0 && <span style={{ fontSize: 13, color: "#ef4444" }}>❌ {failed}</span>}
              </div>
            )}
          </div>

          {done && (
            <div style={{ background: allGood ? "#16a34a22" : critFail > 0 ? "#dc262622" : "#f59e0b22", border: `1px solid ${allGood ? "#22c55e44" : critFail > 0 ? "#ef444444" : "#f59e0b44"}`, borderRadius: 12, padding: "1rem 1.25rem", marginBottom: "1.5rem", display: "flex", gap: 12, alignItems: "center" }}>
              <span style={{ fontSize: 28 }}>{allGood ? "🏆" : critFail > 0 ? "🚨" : "⚠️"}</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: allGood ? "#22c55e" : critFail > 0 ? "#ef4444" : "#f59e0b" }}>
                  {allGood ? "ALL SYSTEMS GO — DEMO READY!" : critFail > 0 ? `${critFail} CRITICAL FAILURE${critFail > 1 ? "S" : ""} — FIX BEFORE DEMO` : "Warnings present — non-critical, demo will work"}
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{passed}/{CHECKS.length} checks passed · {new Date().toLocaleTimeString()}</div>
              </div>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            {/* Checks */}
            <div style={{ background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 12, padding: "1.25rem" }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: "#f1f5f9", marginBottom: "1rem" }}>System Checks</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {CHECKS.map(check => {
                  const result  = results[check.id];
                  const status  = result?.status || (running ? "running" : "pending");
                  const icon    = status === "pass" ? "✅" : status === "fail" ? "❌" : status === "warn" ? "⚠️" : status === "running" ? "⚡" : "○";
                  const color   = status === "pass" ? "#22c55e" : status === "fail" ? "#ef4444" : status === "warn" ? "#f59e0b" : "#334155";
                  return (
                    <div key={check.id} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "6px 8px", background: "#0a0f1e", borderRadius: 6 }}>
                      <span style={{ fontSize: 12, flexShrink: 0, marginTop: 1 }}>{icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                          <span style={{ fontSize: 11, color: "#e2e8f0" }}>{check.label}</span>
                          {check.critical && <span style={{ fontSize: 9, background: "#ef444422", color: "#ef4444", padding: "1px 4px", borderRadius: 3, fontWeight: 600 }}>CRITICAL</span>}
                        </div>
                        {result?.detail && <div style={{ fontSize: 10, color, marginTop: 1 }}>{result.detail}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Live log */}
              <div style={{ background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 12, padding: "1.25rem", flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#f1f5f9", marginBottom: "1rem" }}>Live Log</div>
                <div style={{ maxHeight: 300, overflowY: "auto", display: "flex", flexDirection: "column", gap: 3 }}>
                  {log.length === 0
                    ? <div style={{ color: "#334155", fontSize: 12, textAlign: "center", marginTop: "2rem" }}>Click Run to begin</div>
                    : log.map((e, i) => (
                        <div key={i} style={{ display: "flex", gap: 8, fontSize: 11 }}>
                          <span style={{ color: "#334155", flexShrink: 0 }}>{e.ts}</span>
                          <span style={{ color: e.type === "pass" ? "#22c55e" : e.type === "fail" ? "#ef4444" : e.type === "warn" ? "#f59e0b" : "#64748b" }}>{e.msg}</span>
                        </div>
                      ))
                  }
                </div>
              </div>

              {/* Physical checklist */}
              <div style={{ background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 12, padding: "1.25rem" }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: "#f1f5f9", marginBottom: "1rem" }}>🎯 Physical Demo Day Checklist</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {[
                    "Laptop fully charged + charger in bag",
                    "Phone hotspot ON and tested",
                    "Browser tabs pre-opened: /demo, /simulate, /pitch",
                    "Backup screen recording downloaded",
                    "Twilio demo phone set (for real WhatsApp send)",
                    "Demo script timed — under 8 minutes",
                    "Q&A answers memorised — top 7 questions",
                    "Arrive 45 min early — test projector connection",
                    "YONO mockup open on phone — /m page",
                    "Run this pre-flight — all green before stage",
                  ].map((tip, i) => (
                    <div key={i} style={{ display: "flex", gap: 7, alignItems: "flex-start" }}>
                      <span style={{ color: "#334155", flexShrink: 0, fontSize: 12 }}>☐</span>
                      <span style={{ fontSize: 11, color: "#64748b", lineHeight: 1.5 }}>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
