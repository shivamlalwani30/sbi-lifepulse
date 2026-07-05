import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const YONO_OFFERS = [
  { id: 1, customer: "Priya Sharma", event: "Salary Hike", title: "Your income grew — invest the difference!", body: "Start a ₹2,000/month SIP today. At this growth rate, you could have ₹85L by 60.", cta: "Start SIP", icon: "📈", color: "#22c55e", badge: "New Offer" },
  { id: 2, customer: "Arjun Mehta", event: "Relocation", title: "Welcome to Bengaluru!", body: "Upgrade your SBI card limit for your new city's expenses. Instant approval.", cta: "Upgrade Card", icon: "🏙️", color: "#3b82f6", badge: "Personalised" },
  { id: 3, customer: "Deepak Nair", event: "New Baby", title: "Congratulations on your baby! 👶", body: "Secure their future with SBI Child Plan — guaranteed payouts at age 18, 19, 20, 21.", cta: "Protect Child", icon: "👶", color: "#ec4899", badge: "For You" },
];

const BOTTOM_TABS = [
  { icon: "🏠", label: "Home" },
  { icon: "💳", label: "Pay" },
  { icon: "📊", label: "Invest" },
  { icon: "🛡️", label: "Insure" },
  { icon: "👤", label: "Profile" },
];

export default function YonoPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [sessions, setSessions] = useState({});
  const [convHistory, setConvHistory] = useState([]);

  const openOffer = async (offer) => {
    setSelectedOffer(offer);
    setChatOpen(false);
    setMessages([]);
    setEnrolled(false);

    // Map offer to customer
    const customerMap = { 1: "CUST001", 2: "CUST002", 3: "CUST006" };
    const cid = customerMap[offer.id];

    try {
      const res = await fetch(`${API}/api/agent/outreach/${cid}`, { method: "POST" });
      const data = await res.json();
      setSessions(prev => ({ ...prev, [cid]: { message: data.whatsapp_message, cid } }));
      setMessages([{ from: "agent", text: data.whatsapp_message, time: now() }]);
      setConvHistory([{ role: "assistant", content: data.whatsapp_message }]);
      setChatOpen(true);
    } catch {
      setMessages([{ from: "agent", text: `${offer.body}\n\nWould you like to proceed?`, time: now() }]);
      setConvHistory([{ role: "assistant", content: `${offer.body}\n\nWould you like to proceed?` }]);
      setChatOpen(true);
    }
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || typing) return;
    setInput("");
    const newMsg = { from: "user", text, time: now() };
    setMessages(prev => [...prev, newMsg]);
    setTyping(true);

    const customerMap = { 1: "CUST001", 2: "CUST002", 3: "CUST006" };
    const cid = selectedOffer ? customerMap[selectedOffer.id] : "CUST001";

    try {
      const res = await fetch(`${API}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_id: cid, message: text, conversation_history: convHistory }),
      });
      const data = await res.json();
      await new Promise(r => setTimeout(r, 700));
      setMessages(prev => [...prev, { from: "agent", text: data.reply_message, time: now() }]);
      setConvHistory(data.conversation_history || []);
      if (data.enrollment_status === "enrolled") setEnrolled(true);
    } catch {
      await new Promise(r => setTimeout(r, 500));
      setMessages(prev => [...prev, { from: "agent", text: "Your request has been processed. You'll receive a confirmation SMS shortly.", time: now() }]);
      setEnrolled(true);
    } finally {
      setTyping(false);
    }
  };

  return (
    <>
      <Head><title>SBI YONO — LifePulse In-App</title></Head>
      <div style={{ minHeight: "100vh", background: "#0a0f1e", fontFamily: "'Inter', sans-serif", color: "#e2e8f0" }}>

        {/* Page nav */}
        <nav style={{ background: "#0d1629", borderBottom: "1px solid #1e2d4a", padding: "0 1.5rem", height: 54, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18 }}>⚡</span>
            <span style={{ fontWeight: 700, color: "#fff" }}>SBI LifePulse</span>
            <span style={{ fontSize: 11, color: "#64748b" }}>/ YONO In-App Mockup</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Link href="/" style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #1e2d4a", background: "transparent", color: "#94a3b8", fontSize: 12, textDecoration: "none" }}>← Dashboard</Link>
            <Link href="/demo" style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: "#1a56db", color: "#fff", fontSize: 12, textDecoration: "none", fontWeight: 500 }}>▶ Demo Mode</Link>
          </div>
        </nav>

        <div style={{ padding: "2rem", display: "flex", gap: "2rem", alignItems: "flex-start", justifyContent: "center" }}>

          {/* Context text */}
          <div style={{ maxWidth: 280, paddingTop: "1rem" }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#f1f5f9", marginBottom: 10 }}>LifePulse inside YONO</h2>
            <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.7, marginBottom: "1rem" }}>
              LifePulse doesn't just work on WhatsApp — it surfaces directly inside YONO as personalised nudges at the exact right moment.
            </p>
            <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.7, marginBottom: "1.5rem" }}>
              Each offer is generated by the 4-agent pipeline. Tapping "Start SIP" or "Protect Child" opens an in-app AI chat that completes enrollment — no branch, no call center.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {YONO_OFFERS.map(offer => (
                <button key={offer.id} onClick={() => openOffer(offer)}
                  style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${selectedOffer?.id === offer.id ? offer.color : "#1e2d4a"}`, background: selectedOffer?.id === offer.id ? offer.color + "22" : "transparent", color: selectedOffer?.id === offer.id ? offer.color : "#94a3b8", fontSize: 12, cursor: "pointer", textAlign: "left", fontWeight: selectedOffer?.id === offer.id ? 600 : 400 }}>
                  {offer.icon} {offer.customer}
                </button>
              ))}
            </div>
          </div>

          {/* Phone mockup */}
          <div style={{ position: "relative" }}>
            {/* Phone frame */}
            <div style={{ width: 375, background: "#0f1923", borderRadius: 40, border: "8px solid #1e2d4a", boxShadow: "0 40px 80px #00000088, inset 0 0 0 1px #2d3f5e", overflow: "hidden", position: "relative" }}>

              {/* Status bar */}
              <div style={{ background: "#00247D", padding: "12px 20px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>9:41</div>
                <div style={{ display: "flex", gap: 4, fontSize: 11, color: "#fff" }}>
                  <span>●●●</span><span>WiFi</span><span>🔋</span>
                </div>
              </div>

              {/* YONO Header */}
              <div style={{ background: "linear-gradient(135deg, #00247D, #003DB2)", padding: "12px 20px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 11, color: "#93c5fd" }}>Good morning,</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>
                      {selectedOffer ? selectedOffer.customer.split(" ")[0] : "Priya"} 👋
                    </div>
                  </div>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#ffffff22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                    {selectedOffer ? selectedOffer.customer.charAt(0) : "P"}
                  </div>
                </div>
                {/* Balance */}
                <div style={{ marginTop: 12, background: "#ffffff11", borderRadius: 12, padding: "10px 14px", display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 10, color: "#93c5fd" }}>Available Balance</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>₹81,000</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 10, color: "#93c5fd" }}>Account</div>
                    <div style={{ fontSize: 12, color: "#fff" }}>SBI00012345</div>
                  </div>
                </div>
              </div>

              {/* Main content area */}
              <div style={{ background: "#f0f4ff", minHeight: 460, position: "relative" }}>

                {!chatOpen ? (
                  <div style={{ padding: "16px" }}>
                    {/* Quick actions */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 16 }}>
                      {[["💸","Send"],["📥","Receive"],["📱","Recharge"],["🔄","History"]].map(([icon, label]) => (
                        <div key={label} style={{ background: "#fff", borderRadius: 10, padding: "10px 4px", textAlign: "center", boxShadow: "0 1px 4px #00000011" }}>
                          <div style={{ fontSize: 20 }}>{icon}</div>
                          <div style={{ fontSize: 10, color: "#64748b", marginTop: 3 }}>{label}</div>
                        </div>
                      ))}
                    </div>

                    {/* LifePulse offers */}
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#00247D" }}>⚡ LIFEPULSE FOR YOU</span>
                        <span style={{ fontSize: 9, background: "#00247D", color: "#fff", padding: "1px 5px", borderRadius: 99 }}>AI-Powered</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {YONO_OFFERS.map(offer => (
                          <div key={offer.id} onClick={() => openOffer(offer)}
                            style={{ background: "#fff", borderRadius: 12, padding: "12px 14px", boxShadow: "0 2px 8px #00000011", cursor: "pointer", borderLeft: `4px solid ${offer.color}`, position: "relative" }}>
                            <div style={{ position: "absolute", top: 8, right: 10, fontSize: 9, background: offer.color + "22", color: offer.color, padding: "2px 6px", borderRadius: 99, fontWeight: 700 }}>{offer.badge}</div>
                            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                              <span style={{ fontSize: 22 }}>{offer.icon}</span>
                              <div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", marginBottom: 3 }}>{offer.title}</div>
                                <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.4 }}>{offer.body.slice(0, 70)}...</div>
                                <div style={{ marginTop: 8 }}>
                                  <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: offer.color, padding: "4px 12px", borderRadius: 99 }}>{offer.cta} →</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recent txns */}
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 8 }}>RECENT TRANSACTIONS</div>
                      {[
                        { desc: "NEFT-INFOSYS SALARY DEC", amt: "+₹78,000", color: "#22c55e" },
                        { desc: "UPI-SWIGGY ORDER", amt: "-₹450", color: "#94a3b8" },
                        { desc: "NEFT-HOUSE RENT DEC", amt: "-₹8,000", color: "#94a3b8" },
                      ].map((t, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #e2e8f0" }}>
                          <div style={{ fontSize: 11, color: "#475569" }}>{t.desc}</div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: t.color }}>{t.amt}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* In-app AI Chat */
                  <div style={{ display: "flex", flexDirection: "column", height: 460 }}>
                    {/* Chat header */}
                    <div style={{ background: "#00247D", padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                      <button onClick={() => { setChatOpen(false); setSelectedOffer(null); }}
                        style={{ background: "none", border: "none", color: "#fff", fontSize: 16, cursor: "pointer" }}>←</button>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>SBI LifePulse Assistant</span>
                      {enrolled && <span style={{ marginLeft: "auto", fontSize: 10, background: "#22c55e", color: "#fff", padding: "2px 6px", borderRadius: 99 }}>✅ Done</span>}
                    </div>

                    {/* Messages */}
                    <div style={{ flex: 1, overflowY: "auto", padding: "12px", background: "#eef2ff", display: "flex", flexDirection: "column", gap: 8 }}>
                      {messages.map((m, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: m.from === "user" ? "flex-end" : "flex-start" }}>
                          <div style={{ maxWidth: "80%", padding: "8px 12px", borderRadius: m.from === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px", background: m.from === "user" ? "#00247D" : "#fff", color: m.from === "user" ? "#fff" : "#1e293b", fontSize: 12, lineHeight: 1.5, boxShadow: "0 1px 3px #00000011" }}>
                            <div style={{ whiteSpace: "pre-wrap" }}>{m.text}</div>
                            <div style={{ fontSize: 9, color: m.from === "user" ? "#93c5fd" : "#94a3b8", marginTop: 3 }}>{m.time}</div>
                          </div>
                        </div>
                      ))}
                      {typing && (
                        <div style={{ display: "flex" }}>
                          <div style={{ background: "#fff", borderRadius: "12px 12px 12px 2px", padding: "10px 14px", display: "flex", gap: 4 }}>
                            {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#00247D", animation: `bounce 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Input */}
                    <div style={{ background: "#fff", padding: "8px 10px", display: "flex", gap: 8, borderTop: "1px solid #e2e8f0" }}>
                      <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()}
                        placeholder="Type your reply..."
                        style={{ flex: 1, background: "#f0f4ff", border: "none", borderRadius: 20, padding: "8px 14px", fontSize: 12, fontFamily: "inherit", outline: "none", color: "#1e293b" }} />
                      <button onClick={sendMessage} disabled={!input.trim() || typing}
                        style={{ width: 36, height: 36, borderRadius: "50%", background: input.trim() ? "#00247D" : "#e2e8f0", border: "none", color: "#fff", fontSize: 14, cursor: "pointer" }}>➤</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom tabs */}
              <div style={{ background: "#fff", display: "flex", borderTop: "1px solid #e2e8f0" }}>
                {BOTTOM_TABS.map((tab, i) => (
                  <button key={i} onClick={() => setActiveTab(i)}
                    style={{ flex: 1, padding: "10px 0", background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                    <span style={{ fontSize: 18 }}>{tab.icon}</span>
                    <span style={{ fontSize: 9, color: activeTab === i ? "#00247D" : "#94a3b8", fontWeight: activeTab === i ? 700 : 400 }}>{tab.label}</span>
                    {activeTab === i && <div style={{ width: 16, height: 2, background: "#00247D", borderRadius: 1 }} />}
                  </button>
                ))}
              </div>

              {/* Home indicator */}
              <div style={{ background: "#0f1923", display: "flex", justifyContent: "center", padding: "8px" }}>
                <div style={{ width: 100, height: 4, background: "#2d3f5e", borderRadius: 2 }} />
              </div>
            </div>
          </div>

          {/* Right side explanation */}
          <div style={{ maxWidth: 260, paddingTop: "1rem" }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", marginBottom: "1rem" }}>How it works in YONO</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { step: "1", title: "Agent detects event", desc: "LifePulse pipeline runs nightly on transaction data" },
                { step: "2", title: "Offer surfaces in app", desc: "Personalised card appears at top of YONO home screen" },
                { step: "3", title: "Customer taps CTA", desc: "Opens AI chat — no form, no navigation, no branch" },
                { step: "4", title: "Claude closes the deal", desc: "Conversational Close Agent completes enrollment in 2–3 messages" },
                { step: "5", title: "Audit log updated", desc: "Every action logged for DPDP & RBI compliance" },
              ].map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 10 }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#1a56db", color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>{s.step}</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#f1f5f9" }}>{s.title}</div>
                    <div style={{ fontSize: 11, color: "#475569", marginTop: 1, lineHeight: 1.5 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}`}</style>
    </>
  );
}

function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
