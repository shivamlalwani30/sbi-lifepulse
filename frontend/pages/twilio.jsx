import { useState, useEffect } from "react";
import Head from "next/head";
import Nav from "../components/Nav";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const SETUP_STEPS = [
  { step: 1, title: "Create free Twilio account", desc: "Go to twilio.com → Sign up (free trial, no credit card)", link: "https://www.twilio.com/try-twilio", cta: "Open Twilio" },
  { step: 2, title: "Activate WhatsApp Sandbox", desc: "Console → Messaging → Try it out → Send a WhatsApp message", link: "https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn", cta: "Open Console" },
  { step: 3, title: "Join your sandbox", desc: "Send 'join <sandbox-word>' to +1 415 523 8886 from your WhatsApp", link: null, cta: null },
  { step: 4, title: "Add credentials to .env", desc: "Copy Account SID + Auth Token from Console Dashboard", link: null, cta: null },
  { step: 5, title: "Set demo phone number", desc: "Add jury member's WhatsApp number to TWILIO_DEMO_PHONE", link: null, cta: null },
];

const ENV_TEMPLATE = `# Add to lifepulse/backend/.env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
TWILIO_DEMO_PHONE=whatsapp:+91XXXXXXXXXX`;

export default function TwilioPage() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState("CUST001");
  const [customers, setCustomers] = useState([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/twilio/status`).then(r => r.json()),
      fetch(`${API}/api/customers`).then(r => r.json()),
    ]).then(([s, c]) => { setStatus(s); setCustomers(c); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const sendDemo = async () => {
    setSending(true); setSendResult(null);
    try {
      const r = await fetch(`${API}/api/twilio/send/${selectedCustomer}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ use_demo_phone: true }),
      });
      const d = await r.json();
      setSendResult(d);
    } catch (e) { setSendResult({ sent: false, error: e.message }); }
    finally { setSending(false); }
  };

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const configured = status?.configured;
  const demoPhoneSet = status?.demo_phone_set;

  return (
    <>
      <Head><title>SBI LifePulse — Real WhatsApp Setup</title></Head>
      <div style={{ minHeight: "100vh", background: "#0a0f1e", fontFamily: "'Inter',sans-serif", color: "#e2e8f0" }}>
        <Nav subtitle="TWILIO WHATSAPP" />
        <div style={{ padding: "1.5rem 2rem", maxWidth: 900, margin: "0 auto" }}>

          <div style={{ marginBottom: "1.5rem" }}>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", margin: 0 }}>Real WhatsApp Delivery</h1>
            <p style={{ color: "#475569", fontSize: 13, margin: "4px 0 0" }}>
              The moment a jury member's phone buzzes with an actual WhatsApp from "SBI LifePulse" — that's the demo moment that wins ₹2.5L.
            </p>
          </div>

          {/* Status banner */}
          {!loading && (
            <div style={{ background: configured ? "#22c55e11" : "#f59e0b11", border: `1px solid ${configured ? "#22c55e44" : "#f59e0b44"}`, borderRadius: 12, padding: "1.25rem", marginBottom: "1.5rem", display: "flex", gap: 12, alignItems: "center" }}>
              <span style={{ fontSize: 28 }}>{configured ? "✅" : "⚙️"}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: configured ? "#22c55e" : "#f59e0b" }}>
                  {configured ? "Twilio Configured — Ready to send real WhatsApp!" : "Twilio Not Configured — Follow setup steps below"}
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 6, flexWrap: "wrap" }}>
                  {[
                    { label: "Twilio SDK", ok: status?.twilio_available },
                    { label: "Account SID", ok: status?.account_sid_set },
                    { label: "Auth Token", ok: status?.auth_token_set },
                    { label: "From Number", ok: status?.from_number_set },
                    { label: "Demo Phone", ok: status?.demo_phone_set },
                  ].map(item => (
                    <span key={item.label} style={{ fontSize: 11, color: item.ok ? "#22c55e" : "#64748b" }}>
                      {item.ok ? "✓" : "○"} {item.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>

            {/* Setup steps */}
            <div>
              <div style={{ background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 12, padding: "1.25rem", marginBottom: "1rem" }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#f1f5f9", marginBottom: "1rem" }}>Setup Steps (15 minutes)</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {SETUP_STEPS.map((s) => (
                    <div key={s.step} style={{ display: "flex", gap: 10 }}>
                      <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#1a56db22", border: "1px solid #1a56db44", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#60a5fa", flexShrink: 0, marginTop: 1 }}>{s.step}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>{s.title}</div>
                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{s.desc}</div>
                        {s.link && (
                          <a href={s.link} target="_blank" rel="noreferrer"
                            style={{ fontSize: 11, color: "#60a5fa", textDecoration: "none", marginTop: 4, display: "inline-block" }}>
                            → {s.cta}
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* .env template */}
              <div style={{ background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 12, padding: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "#f1f5f9" }}>Add to .env file</div>
                  <button onClick={() => copy(ENV_TEMPLATE)}
                    style={{ fontSize: 11, padding: "3px 10px", borderRadius: 5, border: "1px solid #1e2d4a", background: "transparent", color: copied ? "#22c55e" : "#64748b", cursor: "pointer" }}>
                    {copied ? "✓ Copied" : "Copy"}
                  </button>
                </div>
                <pre style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.7, margin: 0, fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
                  {ENV_TEMPLATE}
                </pre>
              </div>
            </div>

            {/* Live send panel */}
            <div>
              <div style={{ background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 12, padding: "1.25rem", marginBottom: "1rem" }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#f1f5f9", marginBottom: "1rem" }}>🚀 Send Real WhatsApp Now</div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: "#475569", marginBottom: 6 }}>Select customer</div>
                  <select value={selectedCustomer} onChange={e => setSelectedCustomer(e.target.value)}
                    style={{ width: "100%", background: "#0a0f1e", border: "1px solid #1e2d4a", color: "#e2e8f0", padding: "8px 12px", borderRadius: 7, fontSize: 13, fontFamily: "inherit" }}>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name} — {c.life_event_hint?.replace(/_/g," ")}</option>)}
                  </select>
                </div>

                {!demoPhoneSet && (
                  <div style={{ fontSize: 12, color: "#f59e0b", background: "#f59e0b11", border: "1px solid #f59e0b33", borderRadius: 8, padding: "8px 12px", marginBottom: 12 }}>
                    ⚠️ Set TWILIO_DEMO_PHONE in .env to enable sending to jury's phone
                  </div>
                )}

                <button onClick={sendDemo} disabled={sending || !configured}
                  style={{ width: "100%", padding: "11px", borderRadius: 8, border: "none", background: configured ? "linear-gradient(135deg,#25d366,#128c7e)" : "#1e2d4a", color: configured ? "#fff" : "#475569", fontSize: 14, fontWeight: 700, cursor: configured ? "pointer" : "default" }}>
                  {sending ? "📤 Sending..." : configured ? "📱 Send Real WhatsApp to Demo Phone" : "⚙️ Configure Twilio First"}
                </button>

                {sendResult && (
                  <div style={{ marginTop: "1rem", padding: "1rem", background: sendResult.sent ? "#22c55e11" : "#ef444411", border: `1px solid ${sendResult.sent ? "#22c55e44" : "#ef444444"}`, borderRadius: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: sendResult.sent ? "#22c55e" : "#ef4444", marginBottom: 6 }}>
                      {sendResult.sent ? "✅ Sent! Check demo phone." : "❌ Send failed"}
                    </div>
                    {sendResult.sent ? (
                      <>
                        <div style={{ fontSize: 12, color: "#64748b" }}>To: {sendResult.to}</div>
                        <div style={{ fontSize: 12, color: "#64748b" }}>SID: {sendResult.message_sid}</div>
                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>"{sendResult.body_preview}"</div>
                      </>
                    ) : (
                      <div style={{ fontSize: 12, color: "#64748b" }}>{sendResult.error}</div>
                    )}
                  </div>
                )}
              </div>

              {/* GFF demo tip */}
              <div style={{ background: "#0d1629", border: "1px solid #f59e0b44", borderRadius: 12, padding: "1.25rem" }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: "#f59e0b", marginBottom: 8 }}>🎯 GFF Demo Tip</div>
                <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.7 }}>
                  Before your pitch: run the pipeline for "Priya Sharma", then ask a jury member to give you their WhatsApp number. While presenting slide 3 (solution), hit "Send Real WhatsApp". By the time you reach slide 4 (demo), their phone has buzzed. <strong style={{ color: "#f1f5f9" }}>That's your ₹2.5L moment.</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
