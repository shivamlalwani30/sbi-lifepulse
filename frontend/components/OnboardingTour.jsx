import { useState, useEffect } from "react";

const STEPS = [
  {
    id: "welcome",
    title: "Welcome to SBI LifePulse ⚡",
    body: "An agentic AI that detects life events from customer transactions and completes product enrollment on WhatsApp — zero branch visit needed.",
    target: null,
    position: "center",
  },
  {
    id: "customers",
    title: "12 Mock Customers",
    body: "Each customer has 3 months of realistic transaction data with a detectable life event — salary hike, relocation, new baby, insurance gap, marriage, or new EMI.",
    target: ".customer-grid",
    position: "bottom",
  },
  {
    id: "pipeline",
    title: "Run the Agent Pipeline",
    body: "Click ▶ Run Pipeline on any customer card. Watch 5 agents fire in sequence — behavior scan, life event detection, fraud gate, eligibility check, and personalized message generation.",
    target: ".run-pipeline-btn",
    position: "bottom",
  },
  {
    id: "event-feed",
    title: "Live Event Feed",
    body: "The right sidebar streams agent events in real time via Server-Sent Events (SSE). Each step appears as it happens — no polling, no refresh.",
    target: ".event-feed",
    position: "left",
  },
  {
    id: "chat",
    title: "WhatsApp Simulation",
    body: "After pipeline completes, click 💬 Chat. Type YES (or haan kar do) to see Agent 4 drive enrollment. The conversation is powered by Claude Sonnet 4.6 in real time.",
    target: ".chat-btn",
    position: "bottom",
  },
  {
    id: "demo",
    title: "Stage Demo Mode",
    body: "For your GFF presentation, use /demo — a fullscreen 3-panel view perfect for projecting. Switch customers with the dropdown at the top.",
    target: null,
    position: "center",
    cta: "Open Demo Mode",
    ctaHref: "/demo",
  },
  {
    id: "explore",
    title: "Explore 17 Pages",
    body: "Use the top nav to explore: Live Simulation, Fraud Gate, Multi-Language, Risk Scoring, Business Case, Agent Explainer, Pitch Kit, and more.",
    target: null,
    position: "center",
    cta: "Start Exploring",
  },
];

export default function OnboardingTour({ onComplete }) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem("lifepulse_tour_seen");
    if (!seen) {
      setTimeout(() => setVisible(true), 800);
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem("lifepulse_tour_seen", "true");
    onComplete?.();
  };

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      dismiss();
    }
  };

  const prev = () => setStep(s => Math.max(0, s - 1));

  if (!visible) return null;

  const current = STEPS[step];
  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <>
      {/* Backdrop */}
      <div onClick={dismiss} style={{ position: "fixed", inset: 0, background: "#00000088", zIndex: 1000, backdropFilter: "blur(2px)" }} />

      {/* Tour modal */}
      <div style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 420,
        background: "#0d1629",
        border: "1px solid #1e2d4a",
        borderRadius: 16,
        padding: "1.75rem",
        zIndex: 1001,
        boxShadow: "0 40px 80px #00000088",
      }}>
        {/* Progress bar */}
        <div style={{ height: 3, background: "#1e2d4a", borderRadius: 2, marginBottom: "1.25rem" }}>
          <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg,#1a56db,#0ea5e9)", borderRadius: 2, transition: "width 0.4s ease" }} />
        </div>

        {/* Step indicator */}
        <div style={{ fontSize: 11, color: "#475569", marginBottom: 8 }}>
          Step {step + 1} of {STEPS.length}
        </div>

        {/* Content */}
        <div style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", marginBottom: 10 }}>
          {current.title}
        </div>
        <div style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.7, marginBottom: "1.5rem" }}>
          {current.body}
        </div>

        {/* Dot indicators */}
        <div style={{ display: "flex", gap: 5, marginBottom: "1.25rem", justifyContent: "center" }}>
          {STEPS.map((_, i) => (
            <div key={i} onClick={() => setStep(i)}
              style={{ width: i === step ? 20 : 6, height: 6, borderRadius: 3, background: i === step ? "#1a56db" : "#1e2d4a", cursor: "pointer", transition: "all 0.2s" }} />
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {step > 0 && (
            <button onClick={prev} style={{ padding: "8px 16px", borderRadius: 7, border: "1px solid #1e2d4a", background: "transparent", color: "#64748b", fontSize: 13, cursor: "pointer" }}>
              ← Back
            </button>
          )}
          {current.ctaHref ? (
            <a href={current.ctaHref} onClick={dismiss}
              style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#1a56db,#0ea5e9)", color: "#fff", fontSize: 13, fontWeight: 700, textDecoration: "none", textAlign: "center", display: "block" }}>
              {current.cta}
            </a>
          ) : (
            <button onClick={step === STEPS.length - 1 ? dismiss : next}
              style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#1a56db,#0ea5e9)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              {step === STEPS.length - 1 ? (current.cta || "Let's go! 🚀") : "Next →"}
            </button>
          )}
          <button onClick={dismiss} style={{ padding: "8px 12px", borderRadius: 7, border: "1px solid #1e2d4a", background: "transparent", color: "#475569", fontSize: 12, cursor: "pointer" }}>
            Skip
          </button>
        </div>
      </div>
    </>
  );
}
