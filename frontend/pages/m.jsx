import { useState, useEffect, useRef } from "react";
import Head from "next/head";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// This page is designed for phone screens — minimal nav, WhatsApp-first
export default function MobileDemoPage() {
  const [customers, setCustomers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [step, setStep] = useState("select"); // select | pipeline | chat | done
  const [pipelineEvents, setPipelineEvents] = useState([]);
  const [chatMsgs, setChatMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [detection, setDetection] = useState(null);
  const [convHistory, setConvHistory] = useState([]);
  const bottomRef = useRef(null);
  const esRef = useRef(null);

  useEffect(() => {
    fetch(`${API}/api/customers`).then(r => r.json()).then(setCustomers).catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMsgs, pipelineEvents]);

  const runPipeline = (customer) => {
    setSelected(customer);
    setStep("pipeline");
    setPipelineEvents([]);
    setChatMsgs([]);
    setEnrolled(false);
    setDetection(null);

    if (esRef.current) esRef.current.close();
    const es = new EventSource(`${API}/api/pipeline/${customer.id}/stream`);
    esRef.current = es;

    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      setPipelineEvents(prev => [...prev, data]);

      if (data.type === "detection") setDetection(data.payload);
      if (data.type === "complete") {
        setChatMsgs([{ from: "agent", text: data.payload.whatsapp_message, time: now() }]);
        setConvHistory([{ role: "assistant", content: data.payload.whatsapp_message }]);
        setStep("chat");
        es.close();
      }
    };
    es.onerror = () => { es.close(); };
  };

  const send = async () => {
    if (!input.trim() || typing) return;
    const text = input.trim();
    setInput("");
    setChatMsgs(prev => [...prev, { from: "user", text, time: now() }]);
    setTyping(true);
    try {
      const r = await fetch(`${API}/api/chat`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_id: selected.id, message: text, conversation_history: convHistory }),
      });
      const d = await r.json();
      await new Promise(r => setTimeout(r, 700));
      setChatMsgs(prev => [...prev, { from: "agent", text: d.reply_message, time: now() }]);
      setConvHistory(d.conversation_history || []);
      if (d.enrollment_status === "enrolled") { setEnrolled(true); setStep("done"); }
    } catch { setChatMsgs(prev => [...prev, { from: "agent", text: "Error. Please try again.", time: now() }]); }
    finally { setTyping(false); }
  };

  return (
    <>
      <Head>
        <title>SBI LifePulse — Try It</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#0a0f1e" />
      </Head>
      <div style={{ minHeight: "100vh", background: "#0a0f1e", fontFamily: "'Inter',sans-serif", color: "#e2e8f0", maxWidth: 480, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ background: "#0d1629", padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid #1e2d4a", position: "sticky", top: 0, zIndex: 100 }}>
          <div style={{ width: 28, height: 28, background: "linear-gradient(135deg,#1a56db,#0ea5e9)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>⚡</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>SBI LifePulse</div>
            <div style={{ fontSize: 10, color: "#64748b" }}>Interactive Demo · GFF 2026</div>
          </div>
          {step !== "select" && (
            <button onClick={() => setStep("select")} style={{ marginLeft: "auto", background: "none", border: "none", color: "#64748b", fontSize: 13, cursor: "pointer" }}>← Back</button>
          )}
        </div>

        {/* Step: Select customer */}
        {step === "select" && (
          <div style={{ padding: "1.25rem" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>Pick a customer</div>
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: "1.25rem" }}>See how LifePulse detects their life event and sends a personalized offer.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {customers.map(c => {
                const EVENT_EMOJI = { salary_hike:"📈", city_relocation:"🏙️", new_emi_detected:"🏠", insurance_gap:"🛡️", marriage_detected:"💍", new_baby_detected:"👶" };
                const emoji = EVENT_EMOJI[c.life_event_hint] || "⚡";
                const colors = { salary_hike:"#22c55e", city_relocation:"#3b82f6", new_emi_detected:"#f59e0b", insurance_gap:"#ef4444", marriage_detected:"#a855f7", new_baby_detected:"#ec4899" };
                const color = colors[c.life_event_hint] || "#60a5fa";
                return (
                  <button key={c.id} onClick={() => runPipeline(c)}
                    style={{ padding: "14px 16px", borderRadius: 12, border: `1px solid ${color}33`, background: "#0d1629", cursor: "pointer", textAlign: "left", display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ width: 44, height: 44, borderRadius: "50%", background: color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{emoji}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#f1f5f9" }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{c.city} · {c.life_event_hint?.replace(/_/g," ")}</div>
                    </div>
                    <div style={{ marginLeft: "auto", fontSize: 18, color: "#334155" }}>→</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step: Pipeline running */}
        {step === "pipeline" && (
          <div style={{ padding: "1.25rem" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>Analysing {selected?.name}...</div>
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: "1rem" }}>Watch 5 agents process their transaction data in real time.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {pipelineEvents.map((ev, i) => (
                <div key={i} style={{ padding: "10px 12px", background: "#0d1629", borderRadius: 8, borderLeft: `3px solid ${ev.type === "complete" ? "#22c55e" : ev.type === "detection" ? "#a855f7" : "#1a56db"}`, animation: "fadeIn 0.3s ease" }}>
                  <div style={{ fontSize: 13, color: "#e2e8f0" }}>{ev.payload?.message}</div>
                  {ev.payload?.confidence && <div style={{ fontSize: 11, color: "#22c55e", marginTop: 3 }}>Confidence: {Math.round(ev.payload.confidence * 100)}%</div>}
                  {ev.payload?.recommended_product && <div style={{ fontSize: 11, color: "#93c5fd", marginTop: 2 }}>→ {ev.payload.recommended_product}</div>}
                </div>
              ))}
              {pipelineEvents.length === 0 && (
                <div style={{ textAlign: "center", padding: "2rem", color: "#334155" }}>
                  <div style={{ fontSize: 24, marginBottom: 8, animation: "spin 1s linear infinite", display: "inline-block" }}>⚡</div>
                  <div>Starting pipeline...</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step: Chat */}
        {(step === "chat" || step === "done") && (
          <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 57px)" }}>
            {/* WA Header */}
            <div style={{ background: "#128c7e", padding: "10px 14px", display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#075e54", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🏦</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>SBI LifePulse</div>
                <div style={{ fontSize: 11, color: "#b2dfdb" }}>{typing ? "typing..." : enrolled ? "Enrolled ✅" : "Active"}</div>
              </div>
              {enrolled && <div style={{ marginLeft: "auto", background: "#16a34a", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99 }}>✅ Done</div>}
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "12px", background: "#0d1a14" }}>
              {chatMsgs.map((m, i) => (
                <div key={i} style={{ display: "flex", justifyContent: m.from === "user" ? "flex-end" : "flex-start", marginBottom: 8 }}>
                  <div style={{ maxWidth: "82%", padding: "9px 12px", borderRadius: m.from === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px", background: m.from === "user" ? "#005c4b" : "#1f2c34", color: "#e9edef", fontSize: 14, lineHeight: 1.5 }}>
                    <div style={{ whiteSpace: "pre-wrap" }}>{m.text}</div>
                    <div style={{ fontSize: 10, color: "#8696a0", marginTop: 3, textAlign: "right" }}>{m.time}</div>
                  </div>
                </div>
              ))}
              {typing && (
                <div style={{ display: "flex" }}>
                  <div style={{ background: "#1f2c34", borderRadius: "12px 12px 12px 2px", padding: "12px 16px", display: "flex", gap: 4 }}>
                    {[0,1,2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#8696a0", animation: `bounce 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
                  </div>
                </div>
              )}
              {step === "done" && (
                <div style={{ textAlign: "center", margin: "1rem 0", padding: "1rem", background: "#16a34a22", borderRadius: 12, border: "1px solid #22c55e44" }}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>🎉</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#22c55e" }}>Enrollment Complete!</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Zero branch visit · Under 60 seconds</div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            {step === "chat" && (
              <div style={{ background: "#1f2c34", padding: "8px 10px", display: "flex", gap: 8, alignItems: "center" }}>
                <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
                  placeholder='Try "haan kar do" or "yes"'
                  style={{ flex: 1, background: "#2a3942", border: "none", borderRadius: 20, padding: "10px 14px", color: "#e9edef", fontSize: 14, fontFamily: "inherit", outline: "none" }} />
                <button onClick={send} disabled={!input.trim() || typing}
                  style={{ width: 42, height: 42, borderRadius: "50%", background: input.trim() ? "#00a884" : "#2a3942", border: "none", color: "#fff", fontSize: 16, cursor: "pointer" }}>➤</button>
              </div>
            )}
          </div>
        )}
      </div>
      <style>{`
        @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </>
  );
}

function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
