import { useState, useEffect } from "react";
import Head from "next/head";
import Nav from "../components/Nav";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function DeeplinkPage() {
  const [customers, setCustomers] = useState([]);
  const [links, setLinks] = useState({});
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    fetch(`${API}/api/customers`).then(r => r.json()).then(async (cs) => {
      setCustomers(cs);
      const results = {};
      await Promise.all(cs.map(async c => {
        try {
          const r = await fetch(`${API}/api/deeplink/${c.id}`);
          results[c.id] = await r.json();
        } catch { results[c.id] = null; }
      }));
      setLinks(results);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const copy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  };

  const PRODUCT_COLOR = {
    SIP_2000: "#22c55e", CARD_UPGRADE: "#3b82f6", TERM_PLAN: "#f59e0b",
    LIFE_PROTECT: "#ef4444", JOINT_ACC_HOMELOAN: "#a855f7", CHILD_PLAN: "#ec4899",
    SAVINGS_OPT: "#60a5fa", HOME_LOAN_TOPUP: "#fb923c",
  };

  return (
    <>
      <Head><title>SBI LifePulse — YONO Deeplinks</title></Head>
      <div style={{ minHeight: "100vh", background: "#0a0f1e", fontFamily: "'Inter',sans-serif", color: "#e2e8f0" }}>
        <Nav subtitle="YONO DEEPLINKS" />
        <div style={{ padding: "1.5rem 2rem", maxWidth: 1100, margin: "0 auto" }}>

          <div style={{ marginBottom: "1rem" }}>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", margin: 0 }}>YONO Deeplink Generator</h1>
            <p style={{ color: "#475569", fontSize: 13, margin: "4px 0 0" }}>
              Pre-filled YONO app deeplinks for one-tap enrollment. Customer taps → YONO opens → product screen ready → one confirm button.
            </p>
          </div>

          {/* Why deeplinks callout */}
          <div style={{ background: "#0d1629", border: "1px solid #3b82f644", borderRadius: 10, padding: "10px 16px", marginBottom: "1.5rem", display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 20 }}>⚡</span>
            <div style={{ fontSize: 13, color: "#64748b" }}>
              <strong style={{ color: "#60a5fa" }}>WhatsApp Chat enrollment:</strong> 4–6 turns, ~5 minutes.{" "}
              <strong style={{ color: "#22c55e" }}>Deeplink enrollment:</strong> 1 tap, ~10 seconds.
              Both are fully compliant — deeplink is the premium UX path.
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", color: "#475569", padding: "3rem" }}>Generating deeplinks...</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px,1fr))", gap: "1rem" }}>
              {customers.map(c => {
                const link = links[c.id];
                if (!link) return null;
                const color = PRODUCT_COLOR[link.product_code] || "#60a5fa";
                return (
                  <div key={c.id} style={{ background: "#0d1629", border: `1px solid ${color}33`, borderRadius: 12, padding: "1.25rem" }}>
                    {/* Header */}
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color, flexShrink: 0 }}>
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>{c.name}</div>
                        <div style={{ fontSize: 11, color: "#475569" }}>{c.city}</div>
                      </div>
                    </div>

                    {/* Screen title */}
                    <div style={{ background: "#0a0f1e", borderRadius: 8, padding: "8px 10px", marginBottom: 10 }}>
                      <div style={{ fontSize: 11, color: "#475569", marginBottom: 4 }}>YONO Screen</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: color }}>{link.screen_title}</div>
                    </div>

                    {/* Pre-filled fields */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
                      {link.pre_filled_fields?.map((f, i) => (
                        <div key={i} style={{ fontSize: 11, color: "#22c55e", display: "flex", gap: 6 }}>
                          <span>✓</span><span>{f}</span>
                        </div>
                      ))}
                    </div>

                    {/* One-tap message */}
                    <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 12, lineHeight: 1.5 }}>
                      {link.one_tap_message}
                    </div>

                    {/* Link actions */}
                    <div style={{ display: "flex", gap: 6 }}>
                      <div style={{ flex: 1, background: "#0a0f1e", borderRadius: 6, padding: "6px 8px", fontSize: 10, color: "#334155", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {link.web_fallback}
                      </div>
                      <button onClick={() => copy(link.web_fallback, c.id)}
                        style={{ padding: "6px 10px", borderRadius: 6, border: "none", background: copied === c.id ? "#22c55e22" : color + "22", color: copied === c.id ? "#22c55e" : color, fontSize: 11, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
                        {copied === c.id ? "✓ Copied" : "Copy"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* How it works in production */}
          <div style={{ background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 12, padding: "1.25rem", marginTop: "1.5rem" }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: "#f1f5f9", marginBottom: "1rem" }}>In Production: Two Enrollment Paths</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ background: "#0a0f1e", borderRadius: 10, padding: "1rem", border: "1px solid #25d36644" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#25d366", marginBottom: 6 }}>💬 WhatsApp Chat Flow</div>
                <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>Agent 4 (Conversational Close) handles the full conversation. Best for complex products needing explanation. 4–6 turns average.</div>
                <div style={{ fontSize: 11, color: "#475569", marginTop: 8 }}>Use for: Term plans, child plans, home loans</div>
              </div>
              <div style={{ background: "#0a0f1e", borderRadius: 10, padding: "1rem", border: "1px solid #00247D44" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#60a5fa", marginBottom: 6 }}>📱 YONO Deeplink Flow</div>
                <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>Pre-filled link in WhatsApp message. Customer taps → YONO opens with all fields ready → one confirm button. 10 seconds total.</div>
                <div style={{ fontSize: 11, color: "#475569", marginTop: 8 }}>Use for: SIP, card upgrade, savings products</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
