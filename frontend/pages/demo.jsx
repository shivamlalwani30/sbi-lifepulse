import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const STEPS = ["idle", "analyzing", "detected", "messaging", "chat", "enrolled"];

export default function DemoPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState([]);
  const [selectedId, setSelectedId] = useState("CUST001");
  const [step, setStep] = useState("idle");
  const [events, setEvents] = useState([]);
  const [detection, setDetection] = useState(null);
  const [whatsappMsg, setWhatsappMsg] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [enrollmentStatus, setEnrollmentStatus] = useState("pending");

  // Keyboard shortcut: Space = run demo, R = reset
  useEffect(() => {
    const handleKey = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.code === "Space" && step === "idle") { e.preventDefault(); runDemo(); }
      if (e.code === "KeyR") { e.preventDefault(); reset(); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [step]);

  useEffect(() => {
    fetch(`${API}/api/customers`)
      .then((r) => r.json())
      .then(cs => {
        setCustomers(cs);
        // Support ?customer=CUST001 URL param for pre-selection
        const param = router.query?.customer;
        if (param && cs.find(c => c.id === param)) {
          setSelectedId(param);
        }
      })
      .catch(console.error);
  }, [router.query]);

  const reset = () => {
    setStep("idle");
    setEvents([]);
    setDetection(null);
    setWhatsappMsg("");
    setChatMessages([]);
    setChatInput("");
    setConversationHistory([]);
    setEnrollmentStatus("pending");
    setIsTyping(false);
  };

  const runDemo = () => {
    reset();
    setStep("analyzing");

    const es = new EventSource(`${API}/api/pipeline/${selectedId}/stream`);

    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      setEvents((prev) => [...prev, data]);

      if (data.type === "detection") {
        setDetection(data.payload);
        setStep("detected");
      }
      if (data.type === "outreach") {
        setWhatsappMsg(data.payload.whatsapp_message);
        setStep("messaging");
        setTimeout(() => {
          setChatMessages([{ from: "agent", text: data.payload.whatsapp_message, time: now() }]);
          setConversationHistory([{ role: "assistant", content: data.payload.whatsapp_message }]);
          setStep("chat");
        }, 1200);
        es.close();
      }
      if (data.type === "error") { es.close(); setStep("idle"); }
    };
    es.onerror = () => { es.close(); };
  };

  const sendChat = async () => {
    const text = chatInput.trim();
    if (!text || isTyping) return;
    setChatInput("");
    setChatMessages((prev) => [...prev, { from: "user", text, time: now() }]);
    setIsTyping(true);

    try {
      const res = await fetch(`${API}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_id: selectedId, message: text, conversation_history: conversationHistory }),
      });
      const data = await res.json();
      await new Promise((r) => setTimeout(r, 800));
      setChatMessages((prev) => [...prev, { from: "agent", text: data.reply_message, time: now() }]);
      setConversationHistory(data.conversation_history || []);
      if (data.enrollment_status === "enrolled") {
        setEnrollmentStatus("enrolled");
        setStep("enrolled");
      } else if (data.enrollment_status === "opted_out") {
        setEnrollmentStatus("opted_out");
      }
    } catch (e) {
      setChatMessages((prev) => [...prev, { from: "agent", text: "Error — please try again.", time: now() }]);
    } finally {
      setIsTyping(false);
    }
  };

  const selectedCustomer = customers.find((c) => c.id === selectedId);

  return (
    <>
      <Head><title>SBI LifePulse — Live Demo</title></Head>
      <div style={{ minHeight: "100vh", background: "#070d1a", color: "#e2e8f0", fontFamily: "'Inter', sans-serif", display: "flex", flexDirection: "column" }}>

        {/* Demo Header */}
        <div style={{ background: "#0d1629", borderBottom: "1px solid #1e2d4a", padding: "0 2rem", height: 54, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>⚡</span>
            <span style={{ fontWeight: 700, fontSize: 17, color: "#fff" }}>SBI LifePulse</span>
            <span style={{ fontSize: 11, background: "#1a56db22", color: "#60a5fa", padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>LIVE DEMO</span>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <select
              value={selectedId}
              onChange={(e) => { setSelectedId(e.target.value); reset(); }}
              style={{ background: "#1e2d4a", border: "1px solid #2d3f5e", color: "#e2e8f0", padding: "6px 12px", borderRadius: 7, fontSize: 13, fontFamily: "inherit", cursor: "pointer" }}
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name} — {c.life_event_hint?.replace(/_/g, " ")}</option>
              ))}
            </select>
            <button onClick={reset} style={{ padding: "6px 14px", borderRadius: 7, border: "1px solid #1e2d4a", background: "transparent", color: "#64748b", fontSize: 12, cursor: "pointer" }}>↺ Reset</button>
            <button
              onClick={runDemo}
              disabled={step !== "idle"}
              style={{ padding: "7px 20px", borderRadius: 7, border: "none", background: step === "idle" ? "linear-gradient(135deg,#1a56db,#0ea5e9)" : "#1e2d4a", color: step === "idle" ? "#fff" : "#64748b", fontSize: 13, fontWeight: 600, cursor: step === "idle" ? "pointer" : "default" }}
            >
              {step === "idle" ? "▶ Start Demo" : step === "analyzing" ? "⚡ Analysing..." : step === "detected" ? "🎯 Event Found..." : step === "messaging" ? "📲 Sending..." : step === "enrolled" ? "✅ Enrolled!" : "💬 Chat Open"}
            </button>
          </div>
        </div>

        {/* Main demo area */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0, height: "calc(100vh - 54px)" }}>

          {/* Panel 1: Agent Pipeline */}
          <div style={{ borderRight: "1px solid #1e2d4a", padding: "1.5rem", overflowY: "auto" }}>
            <div style={{ fontSize: 12, color: "#475569", fontWeight: 600, letterSpacing: "0.07em", marginBottom: "1rem", textTransform: "uppercase" }}>Agent Pipeline</div>

            {/* Customer profile */}
            {selectedCustomer && (
              <div style={{ background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 10, padding: "1rem", marginBottom: "1rem" }}>
                <div style={{ fontWeight: 600, fontSize: 15, color: "#f1f5f9", marginBottom: 4 }}>{selectedCustomer.name}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>{selectedCustomer.city} · {selectedCustomer.profile?.occupation}</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>SBI A/C: {selectedCustomer.account_number}</div>
                <div style={{ fontSize: 12, color: "#22c55e", marginTop: 4 }}>✓ DPDP Consent obtained</div>
              </div>
            )}

            {/* Pipeline steps */}
            {[
              { id: "analyzing", icon: "📊", label: "Agent 1: Behavior Monitor", sub: "Scanning 3-month transaction history..." },
              { id: "detected",  icon: "🎯", label: "Agent 2: Life Event Detector", sub: detection ? `${detection.event?.replace(/_/g," ")} · ${Math.round((detection.confidence||0)*100)}% confidence` : "Classifying behavioral signals..." },
              { id: "messaging", icon: "✍️", label: "Agent 3: Personalization", sub: "Generating WhatsApp message via Claude..." },
              { id: "chat",      icon: "💬", label: "Agent 4: Conversational Close", sub: "Completing enrollment in chat..." },
            ].map((s, i) => {
              const stepIdx = STEPS.indexOf(step);
              const thisIdx = STEPS.indexOf(s.id);
              const isDone = stepIdx > thisIdx;
              const isActive = stepIdx === thisIdx || (s.id === "chat" && step === "enrolled");
              return (
                <div key={s.id} style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: isDone ? "#16a34a22" : isActive ? "#1a56db22" : "#1e2d4a", border: `1px solid ${isDone ? "#22c55e" : isActive ? "#1a56db" : "#2d3f5e"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>
                      {isDone ? "✓" : s.icon}
                    </div>
                    {i < 3 && <div style={{ width: 1, flex: 1, background: isDone ? "#22c55e44" : "#1e2d4a", marginTop: 4, minHeight: 16 }} />}
                  </div>
                  <div style={{ paddingTop: 4 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: isDone ? "#22c55e" : isActive ? "#60a5fa" : "#475569" }}>{s.label}</div>
                    {(isDone || isActive) && <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{s.sub}</div>}
                  </div>
                </div>
              );
            })}

            {/* Detection card */}
            {detection && (
              <div style={{ background: "#0d1629", border: "1px solid #7c3aed44", borderRadius: 10, padding: "1rem", marginTop: "0.5rem" }}>
                <div style={{ fontSize: 11, color: "#7c3aed", fontWeight: 600, marginBottom: 6 }}>LIFE EVENT DETECTED</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>
                  {detection.event?.replace(/_/g," ").replace(/\b\w/g, c => c.toUpperCase())}
                </div>
                <div style={{ fontSize: 12, color: "#22c55e" }}>Confidence: {Math.round((detection.confidence||0)*100)}%</div>
                <div style={{ fontSize: 12, color: "#93c5fd", marginTop: 4 }}>→ {detection.recommended_product}</div>
              </div>
            )}
          </div>

          {/* Panel 2: WhatsApp Simulation */}
          <div style={{ borderRight: "1px solid #1e2d4a", display: "flex", flexDirection: "column" }}>
            {/* WA Header */}
            <div style={{ background: "#128c7e", padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#075e54", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🏦</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#fff" }}>SBI LifePulse</div>
                <div style={{ fontSize: 11, color: "#b2dfdb" }}>{isTyping ? "typing..." : "AI Banking Assistant"}</div>
              </div>
              {enrollmentStatus === "enrolled" && (
                <div style={{ marginLeft: "auto", background: "#16a34a", color: "#fff", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 99 }}>✅ Enrolled</div>
              )}
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "1rem", background: "#0d1a14", backgroundImage: "radial-gradient(circle at 1px 1px, #1a2b1f 1px, transparent 0)", backgroundSize: "20px 20px" }}>
              {chatMessages.length === 0 && step === "idle" && (
                <div style={{ textAlign: "center", color: "#2d4a3e", marginTop: "4rem", fontSize: 13 }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
                  Click "Start Demo" to begin
                </div>
              )}
              {chatMessages.length === 0 && step !== "idle" && step !== "chat" && step !== "enrolled" && (
                <div style={{ textAlign: "center", marginTop: "4rem" }}>
                  <div style={{ fontSize: 20, animation: "spin 1s linear infinite", display: "inline-block" }}>⚡</div>
                  <div style={{ fontSize: 13, color: "#2d4a3e", marginTop: 8 }}>Agents processing...</div>
                </div>
              )}
              {chatMessages.map((m, i) => (
                <div key={i} style={{ display: "flex", justifyContent: m.from === "user" ? "flex-end" : "flex-start", marginBottom: 8 }}>
                  <div style={{ maxWidth: "80%", padding: "8px 12px", borderRadius: m.from === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px", background: m.from === "user" ? "#005c4b" : "#1f2c34", color: "#e9edef", fontSize: 13, lineHeight: 1.5 }}>
                    <div style={{ whiteSpace: "pre-wrap" }}>{m.text}</div>
                    <div style={{ fontSize: 10, color: "#8696a0", marginTop: 3, textAlign: "right" }}>{m.time}</div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 8 }}>
                  <div style={{ background: "#1f2c34", borderRadius: "12px 12px 12px 2px", padding: "12px 16px", display: "flex", gap: 4 }}>
                    {[0,1,2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#8696a0", animation: `bounce 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div style={{ background: "#1f2c34", padding: "8px 10px", display: "flex", gap: 8, alignItems: "center" }}>
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendChat()}
                placeholder={step === "chat" || step === "enrolled" ? "Type your reply..." : "Waiting for agent..."}
                disabled={step !== "chat"}
                style={{ flex: 1, background: "#2a3942", border: "none", borderRadius: 20, padding: "9px 14px", color: "#e9edef", fontSize: 13, fontFamily: "inherit", outline: "none" }}
              />
              <button
                onClick={sendChat}
                disabled={!chatInput.trim() || step !== "chat" || isTyping}
                style={{ width: 40, height: 40, borderRadius: "50%", background: chatInput.trim() && step === "chat" ? "#00a884" : "#2a3942", border: "none", color: "#fff", fontSize: 16, cursor: "pointer" }}
              >➤</button>
            </div>
          </div>

          {/* Panel 3: Live Event Log */}
          <div style={{ padding: "1.5rem", overflowY: "auto" }}>
            <div style={{ fontSize: 12, color: "#475569", fontWeight: 600, letterSpacing: "0.07em", marginBottom: "1rem", textTransform: "uppercase" }}>Live Agent Log</div>

            {events.length === 0 ? (
              <div style={{ color: "#1e2d4a", fontSize: 13, textAlign: "center", marginTop: "3rem" }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>📋</div>
                Events will appear here
              </div>
            ) : (
              events.map((ev, i) => (
                <div key={i} style={{ marginBottom: 10, padding: "10px 12px", background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 8, borderLeft: `3px solid ${ev.type === "complete" ? "#22c55e" : ev.type === "detection" ? "#a855f7" : ev.type === "outreach" ? "#f59e0b" : "#1a56db"}` }}>
                  <div style={{ fontSize: 12, color: "#e2e8f0", lineHeight: 1.5 }}>{ev.payload?.message}</div>
                  {ev.payload?.confidence && <div style={{ fontSize: 11, color: "#22c55e", marginTop: 3 }}>Confidence: {Math.round(ev.payload.confidence * 100)}%</div>}
                  {ev.payload?.recommended_product && <div style={{ fontSize: 11, color: "#93c5fd", marginTop: 2 }}>→ {ev.payload.recommended_product}</div>}
                </div>
              ))
            )}

            {step === "enrolled" && (
              <div style={{ background: "#16a34a22", border: "1px solid #22c55e44", borderRadius: 10, padding: "1rem", marginTop: "0.5rem", textAlign: "center" }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>✅</div>
                <div style={{ fontWeight: 700, color: "#22c55e", fontSize: 14 }}>Enrollment Complete!</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Zero branch visit · Zero human agent · Full agentic flow</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1e2d4a; border-radius: 2px; }
      `}</style>
    </>
  );
}

function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
