import { useState } from "react";
import Head from "next/head";
import Nav from "../components/Nav";

const AGENTS = [
  {
    id: 1,
    name: "Behavior Monitor",
    file: "behavior_monitor.py",
    color: "#3b82f6",
    emoji: "📊",
    tagline: "Reads transaction history like a detective",
    what: "Takes raw transaction JSON and extracts behavioral signals — salary trends, location changes, new EMIs, baby spend patterns, wedding spend spikes.",
    how: "Uses Pandas DataFrames to run rolling averages and keyword matching on merchant names and transaction descriptions. No ML — pure rule logic that a bank officer would recognize instantly.",
    input: `{
  "transactions": [
    {"date":"2024-11-01","amount":78000,
     "description":"NEFT-INFOSYS SALARY NOV",
     "category":"salary"},
    {"date":"2024-11-05","amount":-65000,
     "description":"AMRITA HOSPITAL DELIVERY",
     "category":"medical"},
    {"date":"2024-11-15","amount":-12000,
     "description":"FIRSTCRY BABY PRODUCTS",
     "category":"baby"}
  ]
}`,
    output: `{
  "salary_trend_pct": 0.0,
  "salary_trend_direction": "stable",
  "location_change_detected": false,
  "emi_detected": false,
  "baby_spend_detected": true,
  "baby_spend_count": 7,
  "insurance_premium_found": false,
  "avg_monthly_balance": 163333
}`,
    whyfast: "Processes 1 customer in ~2ms. At 500M customers with 100 parallel workers, full scan completes in ~3 hours nightly.",
    juryq: "Q: Why not use ML here? A: Rule-based is faster, cheaper, fully explainable to RBI auditors, and achieves the same accuracy for structured transaction data.",
  },
  {
    id: 2,
    name: "Life Event Detector",
    file: "life_event_detector.py",
    color: "#a855f7",
    emoji: "🎯",
    tagline: "Scores and classifies what's happening in someone's life",
    what: "Takes behavioral signals and scores them against 6 life event types. Returns the winning event with a confidence score and a recommended product.",
    how: "Each life event has a dedicated scoring function. Scores are 0–1 floats. The event with the highest score above 0.45 threshold wins. Insurance gap is suppressed when baby/wedding spend is detected (priority logic).",
    input: `{
  "salary_trend_pct": 0.0,
  "baby_spend_detected": true,
  "baby_spend_count": 7,
  "insurance_premium_found": false,
  "avg_monthly_balance": 163333,
  "spending_by_category": {
    "medical": 77000,
    "baby": 31500
  }
}`,
    output: `{
  "top_event": "new_baby_detected",
  "confidence": 0.95,
  "recommended_product": "SBI Life Child Plan",
  "product_code": "CHILD_PLAN",
  "pitch_angle": "Secure your little one's future from day one",
  "all_scores": {
    "new_baby_detected": 0.95,
    "insurance_gap": 0.00,
    "salary_hike": 0.00
  }
}`,
    whyfast: "Pure Python arithmetic — runs in <1ms per customer. The priority suppression logic prevents false positives that would waste outreach budget.",
    juryq: "Q: What's the false positive rate? A: In our mock dataset, 12/12 customers correctly classified. In production, we'd A/B test confidence thresholds using Agent 5 feedback.",
  },
  {
    id: 3,
    name: "Personalization Agent",
    file: "personalization_agent.py",
    color: "#f59e0b",
    emoji: "✍️",
    tagline: "Claude writes the perfect message for each person",
    what: "Uses Claude Sonnet 4.6 to generate a 2-3 sentence WhatsApp message in natural Hindi-English mix, personalized to the customer's detected life event and profile.",
    how: "Builds a detailed system prompt defining tone, length, language mix, and output format. Passes customer name, event type, and pitch angle as user prompt. A/B variant style is injected as a tone instruction.",
    input: `System: You are SBI LifePulse, a warm WhatsApp assistant.
Write in natural Hinglish, max 3 sentences,
end with YES/NO question.

User: Customer: Deepak Nair (38, Kochi)
Event: New Baby (95% confidence)
Product: SBI Life Child Plan
Context: Hospital delivery + baby products detected.
A/B Variant B: casual, friendly tone`,
    output: `"Deepak bhai, congratulations on your 
new arrival! 🎉 Aapke baby ka future 
secure karna abhi se start kar sakte hain 
— SBI Child Plan mein guaranteed payouts 
milti hain jab wo 18 saal ka hoga.

Kya aap ₹2,000/month se shuru karna 
chahenge? — SBI LifePulse"`,
    whyfast: "~1.2 seconds per customer (Claude API latency). Batch runs use asyncio concurrency so 100 messages generate in ~3 seconds total.",
    juryq: "Q: What if Claude generates something wrong? A: System prompt has strict guardrails — no data references, no promises, max 3 sentences. Output is reviewed in the compliance audit log.",
  },
  {
    id: 4,
    name: "Conversational Close",
    file: "conversational_close.py",
    color: "#22c55e",
    emoji: "💬",
    tagline: "Closes the enrollment entirely in WhatsApp chat",
    what: "Takes the customer's reply and continues the conversation until enrollment_status = 'enrolled' or 'opted_out'. Handles YES, NO, unclear, and stalling responses.",
    how: "Full conversation history is passed to Claude on every turn so context is never lost. System prompt defines the exact enrollment steps for each product. Claude appends a STATUS: line to every response — the backend parses this to update enrollment state.",
    input: `[Conversation so far]:
Agent: "Kya aap ₹2,000/month se shuru 
karna chahenge?"

Customer: "haan kar do"

[System tells Claude]:
Enrollment steps for CHILD_PLAN:
1. Ask child's name + date of birth
2. Ask monthly premium budget
3. Confirm and enroll`,
    output: `{
  "reply_message": "Great Deepak ji! 
Aapke baby ka naam aur date of birth 
batayenge? (e.g. Aryan, 15 Nov 2024)",
  
  "enrollment_status": "pending",
  
  "conversation_history": [
    {"role":"assistant","content":"..."},
    {"role":"user","content":"haan kar do"},
    {"role":"assistant","content":"Great..."}
  ]
}`,
    whyfast: "2–4 conversation turns average to close. Each turn ~1s. Total enrollment time: under 60 seconds from first message to confirmation.",
    juryq: "Q: What happens if the customer says something unexpected? A: Claude handles it gracefully — vague = re-ask simply, NO = polite exit + opt-out, abuse = end conversation with dignity.",
  },
  {
    id: 5,
    name: "Feedback Loop",
    file: "feedback_loop.py",
    color: "#ec4899",
    emoji: "🧠",
    tagline: "The system that makes LifePulse smarter every day",
    what: "Records every enrollment outcome and adjusts confidence thresholds dynamically. High-converting events get wider outreach, low-converting events get more selective.",
    how: "After each conversation ends, outcome (enrolled/opted_out/pending) is recorded with event type, product, city, age, A/B variant, and turn count. Scoring functions are re-calibrated based on empirical conversion rates.",
    input: `{
  "customer_id": "CUST006",
  "event_type": "new_baby_detected",
  "product_code": "CHILD_PLAN",
  "enrolled": true,
  "conversation_turns": 3,
  "ab_variant": "B",
  "city": "Kochi",
  "age": 38,
  "time_to_decision_seconds": 47.2
}`,
    output: `{
  "insights": {
    "new_baby_detected": {
      "conversion_rate": 83.3,
      "adjusted_threshold": 0.40
    },
    "insurance_gap": {
      "conversion_rate": 41.2,
      "adjusted_threshold": 0.55
    }
  },
  "recommendations": [
    "New baby has 83% conversion — increase outreach volume",
    "Variant B outperforms A by 23% — promote to default"
  ]
}`,
    whyfast: "Pure in-memory computation — <1ms. In production, would persist to PostgreSQL and feed a weekly model fine-tuning pipeline.",
    juryq: "Q: Isn't this just a rule engine? A: Agent 5 is a learning rule engine — thresholds shift empirically based on real outcomes. In v2, we'd replace it with a proper bandit algorithm (Thompson Sampling).",
  },
];

export default function ExplainerPage() {
  const [activeAgent, setActiveAgent] = useState(0);
  const [activeTab, setActiveTab] = useState("what");
  const agent = AGENTS[activeAgent];

  return (
    <>
      <Head><title>SBI LifePulse — Agent Explainer</title></Head>
      <div style={{ minHeight: "100vh", background: "#0a0f1e", fontFamily: "'Inter',sans-serif", color: "#e2e8f0" }}>
        <Nav subtitle="AGENT EXPLAINER" />

        <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", height: "calc(100vh - 52px)" }}>

          {/* Agent selector sidebar */}
          <div style={{ background: "#0d1629", borderRight: "1px solid #1e2d4a", padding: "1.25rem", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>5 Agents</div>

            {AGENTS.map((a, i) => (
              <button key={a.id} onClick={() => { setActiveAgent(i); setActiveTab("what"); }}
                style={{ padding: "10px 12px", borderRadius: 9, border: `1px solid ${activeAgent === i ? a.color + "66" : "#1e2d4a"}`, background: activeAgent === i ? a.color + "11" : "transparent", cursor: "pointer", textAlign: "left" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: a.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{a.emoji}</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: activeAgent === i ? a.color : "#94a3b8" }}>Agent {a.id}</div>
                    <div style={{ fontSize: 11, color: "#475569" }}>{a.name}</div>
                  </div>
                </div>
              </button>
            ))}

            {/* Pipeline flow */}
            <div style={{ marginTop: "auto", padding: "10px", background: "#0a0f1e", borderRadius: 8, border: "1px solid #1e2d4a" }}>
              <div style={{ fontSize: 10, color: "#475569", marginBottom: 6, fontWeight: 600 }}>PIPELINE FLOW</div>
              {AGENTS.map((a, i) => (
                <div key={a.id} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ fontSize: 10, color: a.color, fontWeight: 600, padding: "3px 0" }}>{a.emoji} {a.name}</div>
                  {i < AGENTS.length - 1 && <div style={{ width: 1, height: 8, background: "#1e2d4a" }} />}
                </div>
              ))}
            </div>
          </div>

          {/* Main content */}
          <div style={{ overflowY: "auto", padding: "1.5rem 2rem" }}>

            {/* Agent header */}
            <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start", marginBottom: "1.5rem" }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: agent.color + "22", border: `1px solid ${agent.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>
                {agent.emoji}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 4 }}>
                  <h1 style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", margin: 0 }}>Agent {agent.id} — {agent.name}</h1>
                  <span style={{ fontSize: 11, background: agent.color + "22", color: agent.color, padding: "2px 8px", borderRadius: 4, fontWeight: 600, fontFamily: "monospace" }}>{agent.file}</span>
                </div>
                <div style={{ fontSize: 14, color: "#64748b", fontStyle: "italic" }}>{agent.tagline}</div>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 4, marginBottom: "1.5rem", borderBottom: "1px solid #1e2d4a", paddingBottom: "0.75rem" }}>
              {[
                { id: "what", label: "What it does" },
                { id: "how",  label: "How it works" },
                { id: "io",   label: "Input / Output" },
                { id: "perf", label: "Performance" },
                { id: "jury", label: "Jury Q&A" },
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: activeTab === tab.id ? agent.color : "transparent", color: activeTab === tab.id ? "#fff" : "#64748b", fontSize: 12, fontWeight: activeTab === tab.id ? 600 : 400, cursor: "pointer" }}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {activeTab === "what" && (
              <div style={{ fontSize: 15, color: "#94a3b8", lineHeight: 1.8, maxWidth: 700 }}>
                {agent.what}
              </div>
            )}

            {activeTab === "how" && (
              <div style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.8, maxWidth: 700 }}>
                {agent.how}
              </div>
            )}

            {activeTab === "io" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: agent.color, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Input</div>
                  <pre style={{ background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 10, padding: "1rem", fontSize: 12, color: "#94a3b8", overflowX: "auto", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>
                    {agent.input}
                  </pre>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#22c55e", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Output</div>
                  <pre style={{ background: "#0d1629", border: "1px solid #22c55e22", borderRadius: 10, padding: "1rem", fontSize: 12, color: "#94a3b8", overflowX: "auto", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>
                    {agent.output}
                  </pre>
                </div>
              </div>
            )}

            {activeTab === "perf" && (
              <div style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.8, maxWidth: 700, padding: "1rem", background: "#0d1629", borderRadius: 10, border: "1px solid #1e2d4a" }}>
                {agent.whyfast}
              </div>
            )}

            {activeTab === "jury" && (
              <div style={{ maxWidth: 700 }}>
                <div style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.8, padding: "1.25rem", background: "#0d1629", borderRadius: 10, border: `1px solid ${agent.color}44`, borderLeft: `4px solid ${agent.color}` }}>
                  {agent.juryq}
                </div>
                <div style={{ marginTop: "1rem", fontSize: 12, color: "#475569" }}>
                  Tip: For Q&A, always reference the specific file name ({agent.file}) and explain the design decision. Jury members respect engineers who know exactly what their code does.
                </div>
              </div>
            )}

            {/* Navigation between agents */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "2rem", paddingTop: "1rem", borderTop: "1px solid #1e2d4a" }}>
              <button onClick={() => { setActiveAgent(a => Math.max(0, a - 1)); setActiveTab("what"); }}
                disabled={activeAgent === 0}
                style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #1e2d4a", background: "transparent", color: activeAgent === 0 ? "#334155" : "#94a3b8", fontSize: 13, cursor: activeAgent === 0 ? "default" : "pointer" }}>
                ← Previous Agent
              </button>
              <span style={{ fontSize: 12, color: "#475569", alignSelf: "center" }}>Agent {activeAgent + 1} of {AGENTS.length}</span>
              <button onClick={() => { setActiveAgent(a => Math.min(AGENTS.length - 1, a + 1)); setActiveTab("what"); }}
                disabled={activeAgent === AGENTS.length - 1}
                style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: activeAgent === AGENTS.length - 1 ? "#1e2d4a" : "linear-gradient(135deg,#1a56db,#0ea5e9)", color: activeAgent === AGENTS.length - 1 ? "#334155" : "#fff", fontSize: 13, fontWeight: 600, cursor: activeAgent === AGENTS.length - 1 ? "default" : "pointer" }}>
                Next Agent →
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
