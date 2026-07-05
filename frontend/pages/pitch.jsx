import { useState, useEffect } from "react";
import Head from "next/head";
import Nav from "../components/Nav";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function PitchPage() {
  const [scale, setScale]   = useState(null);
  const [health, setHealth] = useState(null);
  const [ab, setAb]         = useState(null);
  const [clv, setClv]       = useState(null);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/scale`).then(r => r.json()).catch(() => null),
      fetch(`${API}/api/health`).then(r => r.json()).catch(() => null),
      fetch(`${API}/api/ab/stats`).then(r => r.json()).catch(() => null),
      fetch(`${API}/api/clv/portfolio`).then(r => r.json()).catch(() => null),
    ]).then(([s, h, a, c]) => { setScale(s); setHealth(h); setAb(a); setClv(c); });
  }, []);

  const copy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  };

  const CopyBox = ({ label, content, id }) => (
    <div style={{ background: "#0a0f1e", border: "1px solid #1e2d4a", borderRadius: 10, padding: "1rem", position: "relative" }}>
      <div style={{ fontSize: 11, color: "#475569", fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
      <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{content}</div>
      <button onClick={() => copy(content, id)}
        style={{ position: "absolute", top: 10, right: 10, padding: "3px 10px", borderRadius: 5, border: "1px solid #1e2d4a", background: copied === id ? "#16a34a22" : "transparent", color: copied === id ? "#22c55e" : "#64748b", fontSize: 11, cursor: "pointer" }}>
        {copied === id ? "✓ Copied" : "Copy"}
      </button>
    </div>
  );

  const winner = ab ? Object.entries(ab).filter(([k]) => k !== "_winner").sort((a,b) => b[1].conversion_rate - a[1].conversion_rate)[0] : null;
  const portfolio = clv?.portfolio_summary;

  return (
    <>
      <Head><title>SBI LifePulse — Pitch Kit</title></Head>
      <div style={{ minHeight: "100vh", background: "#0a0f1e", fontFamily: "'Inter',sans-serif", color: "#e2e8f0" }}>
        <Nav subtitle="PITCH KIT" />
        <div style={{ padding: "1.5rem 2rem", maxWidth: 900, margin: "0 auto" }}>

          <div style={{ marginBottom: "1.5rem" }}>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", margin: 0 }}>Jury-Ready Pitch Kit</h1>
            <p style={{ color: "#475569", fontSize: 13, margin: "4px 0 0" }}>Every number, every line, one-click copy. Open this on your phone before walking on stage.</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

            <CopyBox id="oneliner" label="One-Line Pitch"
              content="SBI LifePulse is a 6-agent AI system that detects customer life events from transaction patterns and completes product enrollment end-to-end on WhatsApp — zero branch visit, zero human agent, ₹0.02 per customer." />

            <CopyBox id="problem" label="Problem Statement (Slide 1)"
              content={`SBI serves 500M+ customers but holds just 1.3 products per customer — versus a global best of 4.2.

Every salary hike, relocation, new baby, and insurance gap is a missed revenue moment. Most of these signals are already in the transaction data — they just aren't being read.

LifePulse changes that.`} />

            {scale && (
              <CopyBox id="impact" label="Business Impact Numbers (Slide 5)"
                content={`At full SBI scale (500M customers):
• ${(scale.funnel?.customers_with_detectable_event||0).toLocaleString()} customers have a detectable life event in any 90-day window
• ${(scale.funnel?.customers_enrolled||0).toLocaleString()} enroll at ${scale.input?.conversion_rate_pct}% conversion
• ₹${scale.revenue?.annual_uplift_cr} Crore annual revenue uplift
• ₹${scale.revenue?.net_benefit_yr1_cr} Crore net benefit Year 1 (after API costs of ₹${scale.revenue?.total_api_cost_cr} Cr)
• ${(scale.unit_economics?.roi_multiple||0).toLocaleString()}× ROI on infrastructure cost
• Phase 1 (80M YONO users): ₹${scale.phase1_yono?.revenue_cr} Cr in 0–6 months

Customer Lifetime Value:
• Average 5-year CLV per enrolled customer: ₹${((portfolio?.avg_clv_5yr_per_customer||0)/1000).toFixed(0)}K
• Portfolio 5-year CLV (demo customers): ₹${((portfolio?.total_clv_5yr||0)/1000).toFixed(0)}K
• At 6M enrolled customers: ₹${clv?.scale_projection?.projected_5yr_clv_cr||0} Crore 5-year portfolio CLV`} />
            )}

            <CopyBox id="tech" label="Tech Stack (Slide 3)"
              content={`6-Agent Architecture:
  Agent 1: Behavior Monitor (Pandas — transaction pattern analysis)
  Agent 2: Life Event Detector (rule scoring engine — 6 event types)
  Agent 3: Personalization Agent (Claude Sonnet 4.6 — Hindi/Tamil/Telugu/Bengali/Marathi)
  Agent 4: Conversational Close Agent (Claude Sonnet 4.6 — enrollment in chat)
  Agent 5: Feedback Loop (outcome learning — auto-calibrates thresholds)
  Agent 6: Intent + Sentiment Classifier (zero-latency, local Python)

Supporting systems:
  Fraud Gate: 6-check pre-send safety gate (blocks compromised accounts)
  Eligibility Checker: validates customer qualifies before any offer
  CLV Calculator: 5-year and lifetime value per customer
  YONO Deeplink Generator: pre-filled app links for 1-tap enrollment
  Twilio Integration: real WhatsApp delivery on demo day
  SQLite Session Store: persistent conversation memory
  Offline Cache: demo works without API key (zero crash risk)

Infrastructure: Python FastAPI + asyncio + Docker + Kubernetes-ready
Frontend: Next.js 14 — 24 pages, zero UI libraries
Tests: 227 automated checks — 100% pass rate`} />

            {ab && winner && (
              <CopyBox id="ab" label="A/B Testing Results"
                content={`Message variant testing (${ab.A?.total_sent + ab.B?.total_sent + ab.C?.total_sent || 0} conversations):
• Variant A — Formal Hindi-English: ${ab.A?.conversion_rate||0}% conversion
• Variant B — Casual Hinglish: ${ab.B?.conversion_rate||0}% conversion
• Variant C — Data-forward: ${ab.C?.conversion_rate||0}% conversion
→ Variant ${ab._winner} wins. System auto-promotes the winning variant.`} />
            )}

            <CopyBox id="multilingual" label="Multi-Language Support"
              content={`LifePulse auto-detects customer language from their city:
• Hindi — UP, Bihar, MP, Rajasthan, Delhi (528M speakers)
• Bengali — West Bengal, Assam (97M speakers)
• Marathi — Maharashtra, Goa (83M speakers)
• Telugu — Andhra Pradesh, Telangana (82M speakers)
• Tamil — Tamil Nadu (75M speakers)
• Kannada — Karnataka (44M speakers)
• Malayalam — Kerala (35M speakers)

65% of SBI's customers prefer regional language. A Tamil message converts 2.4× better than English for Tamil-speaking customers. Zero configuration needed — city → language is automatic.`} />

            <CopyBox id="compliance" label="Regulatory Readiness (Slide 6)"
              content={`DPDP Act 2023 — fully compliant:
✓ Explicit consent before any data processing (§6)
✓ Granular opt-out — reply STOP, consent withdrawn instantly (§13)
✓ No raw personal data shared externally — inference on anonymized patterns only (§8.3)
✓ Full audit log — every agent action timestamped and persisted to SQLite (§11)
✓ Data retention limited to active engagement period (§8.7)
✓ RBI digital communication guidelines followed

Fraud gate blocks outreach to flagged accounts (6 detection checks).
Opt-out processed immediately and logged in DPDP-compliant audit trail.
Conversation transcripts exportable as PDF for compliance review.`} />

            <CopyBox id="qa" label="Top 7 Jury Questions — Pre-Written Answers"
              content={`Q: How is this different from existing SBI alerts?
A: SBI alerts are rule-triggered (salary credit → generic SMS). LifePulse detects life events from behavioral patterns using 6 agents, generates a personalized message in the customer's regional language via Claude, and completes enrollment conversationally. It's proactive + agentic, not reactive + templated.

Q: What about data privacy?
A: All inference runs on anonymized transaction patterns — we never share raw data externally. Every outreach is consent-gated under DPDP Act 2023. Customers can opt out by replying STOP — consent is withdrawn instantly and logged.

Q: Can this scale to 500M users?
A: Agents are stateless and horizontally scalable. FastAPI + asyncio processes 10 concurrent pipelines per server. With Kubernetes HPA scaling to 100 pods, we process 1M customers per day. The bottleneck is LLM API (2.1s per customer) — both scale independently.

Q: What's the false positive rate on fraud detection?
A: Our 6-check fraud gate uses conservative thresholds — in our 12-customer test set, 12/12 legit customers pass (0% false positives). In production, threshold tuning would use Agent 5 feedback loop to minimize both false positives and missed fraud.

Q: What if the customer says STOP?
A: Intent classifier detects STOP in <1ms. Session store processes opt-out immediately, updates consent record, and logs the action for DPDP §13 compliance. No further messages are sent — ever. The /api/sessions/opt-out-log endpoint provides the full audit trail.

Q: How long to integrate with SBI's systems?
A: LifePulse reads from Finacle's existing transaction export API — no rip and replace. The webhook receiver (/api/webhook/transaction) simulates Finacle already. Phase 1 integration estimate: 8–12 weeks for YONO + WhatsApp Business API setup.

Q: What's the cost per customer?
A: ₹0.02 per pipeline run (Claude API cost). Annual cost per customer: ₹0.24. Revenue per enrolled customer: ₹4,200/year. ROI: 17,500×. Even at 10× higher API costs, the ROI is still 1,750×.`} />

            <CopyBox id="close" label="Closing Line (Last Slide)"
              content={`"LifePulse doesn't replace relationship banking — it makes it possible at 500 million relationships simultaneously."`} />

          </div>

          {/* System status */}
          {health && (
            <div style={{ marginTop: "1.5rem", background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 10, padding: "1rem" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Live System Status</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8 }}>
                {[
                  { label: "API", value: health.status === "healthy" ? "✅ Up" : "❌ Down", color: health.status === "healthy" ? "#22c55e" : "#ef4444" },
                  { label: "Customers", value: health.data?.customers_loaded || 0, color: "#60a5fa" },
                  { label: "API Key", value: health.api_key_configured ? "✅ Set" : "⚠️ Missing", color: health.api_key_configured ? "#22c55e" : "#f59e0b" },
                  { label: "Sessions", value: health.data?.active_sessions || 0, color: "#a78bfa" },
                  { label: "Version", value: health.version, color: "#64748b" },
                ].map(s => (
                  <div key={s.label} style={{ background: "#0a0f1e", borderRadius: 7, padding: "8px 10px" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
