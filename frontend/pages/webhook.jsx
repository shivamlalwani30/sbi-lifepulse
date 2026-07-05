import { useState, useEffect } from "react";
import Head from "next/head";
import Nav from "../components/Nav";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const PRESET_TRANSACTIONS = [
  {
    label: "💰 Salary Hike (₹85,000)",
    data: { customer_id: "CUST001", transaction_date: "2025-01-01", amount: 85000, type: "credit", description: "NEFT-INFOSYS LTD SALARY JAN REVISED", category: "salary", merchant: "Infosys Ltd" },
    description: "Push a salary credit that's ₹7K higher than previous months — should trigger salary_hike detection",
  },
  {
    label: "🏠 New Home Loan EMI",
    data: { customer_id: "CUST004", transaction_date: "2025-01-05", amount: -22000, type: "debit", description: "ACH-SBI HOME LOAN EMI JAN NEW", category: "emi", merchant: "SBI Home Loan" },
    description: "Push a new recurring EMI for Rahul Verma — should trigger insurance recommendation",
  },
  {
    label: "👶 Baby Product Purchase",
    data: { customer_id: "CUST001", transaction_date: "2025-01-08", amount: -8500, type: "debit", description: "UPI-FIRSTCRY BABY PRODUCTS MUMBAI", category: "baby", merchant: "FirstCry" },
    description: "Push a baby product purchase — should trigger child plan recommendation",
  },
  {
    label: "🏙️ New City Merchant",
    data: { customer_id: "CUST003", transaction_date: "2025-01-10", amount: -900, type: "debit", description: "UPI-D-MART BENGALURU GROCERY", category: "grocery", merchant: "DMart Bengaluru" },
    description: "Push a Bengaluru merchant for a Lucknow customer — should trigger relocation signal",
  },
  {
    label: "💍 Wedding Venue Booking",
    data: { customer_id: "CUST007", transaction_date: "2025-01-12", amount: -95000, type: "debit", description: "NEFT-WEDDING BANQUET HALL THIRUVANANTHAPURAM", category: "wedding", merchant: "Grand Banquet" },
    description: "Push a large wedding venue debit — should trigger marriage_detected",
  },
  {
    label: "🏥 Hospital Delivery Charges",
    data: { customer_id: "CUST008", transaction_date: "2025-01-15", amount: -72000, type: "debit", description: "NEFT-APOLLO HOSPITAL PATNA DELIVERY", category: "medical", merchant: "Apollo Hospital Patna" },
    description: "Push hospital delivery charges for Ravi Kumar — new baby signal",
  },
];

export default function WebhookPage() {
  const [queue, setQueue] = useState([]);
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [custom, setCustom] = useState({ customer_id: "CUST001", amount: 0, type: "credit", description: "", category: "salary", merchant: "" });
  const [tab, setTab] = useState("presets");
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    fetch(`${API}/api/customers`).then(r => r.json()).then(setCustomers).catch(() => {});
    fetchQueue();
  }, []);

  const fetchQueue = () => {
    fetch(`${API}/api/webhook/queue`).then(r => r.json()).then(d => setQueue(d.queue || [])).catch(() => {});
  };

  const sendTransaction = async (txnData) => {
    setSending(true);
    setLastResult(null);
    try {
      const res = await fetch(`${API}/api/webhook/transaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...txnData, transaction_date: txnData.transaction_date || new Date().toISOString().split("T")[0] }),
      });
      const data = await res.json();
      setLastResult(data);
      fetchQueue();
    } catch (e) {
      setLastResult({ status: "error", error: e.message });
    } finally {
      setSending(false);
    }
  };

  const EVENT_COLOR = { salary_hike: "#22c55e", city_relocation: "#3b82f6", new_emi_detected: "#f59e0b", insurance_gap: "#ef4444", marriage_detected: "#a855f7", new_baby_detected: "#ec4899" };

  return (
    <>
      <Head><title>SBI LifePulse — Webhook Simulator</title></Head>
      <div style={{ minHeight: "100vh", background: "#0a0f1e", fontFamily: "'Inter',sans-serif", color: "#e2e8f0" }}>
        <Nav subtitle="WEBHOOK SIMULATOR" />

        <div style={{ padding: "1.5rem 2rem", maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ marginBottom: "1.5rem" }}>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", margin: 0 }}>Finacle Webhook Simulator</h1>
            <p style={{ color: "#475569", fontSize: 13, margin: "4px 0 0" }}>
              In production, SBI's Finacle core banking system calls <code style={{ background: "#1e2d4a", padding: "1px 5px", borderRadius: 3, fontSize: 11 }}>POST /api/webhook/transaction</code> after every transaction. Simulate it here — push a fake transaction and watch LifePulse react in real time.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "1.5rem" }}>

            {/* Left: transaction sender */}
            <div>
              {/* Tabs */}
              <div style={{ display: "flex", gap: 4, marginBottom: "1rem" }}>
                {["presets", "custom"].map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    style={{ padding: "6px 16px", borderRadius: 7, border: "none", background: tab === t ? "#1a56db" : "#1e2d4a", color: tab === t ? "#fff" : "#64748b", fontSize: 12, fontWeight: tab === t ? 600 : 400, cursor: "pointer", textTransform: "capitalize" }}>
                    {t === "presets" ? "📦 Preset Transactions" : "✏️ Custom Transaction"}
                  </button>
                ))}
              </div>

              {tab === "presets" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {PRESET_TRANSACTIONS.map((preset, i) => (
                    <div key={i} style={{ background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 12, padding: "1rem 1.25rem", display: "flex", gap: "1rem", alignItems: "center" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#f1f5f9", marginBottom: 4 }}>{preset.label}</div>
                        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>{preset.description}</div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <span style={{ fontSize: 11, background: "#1e2d4a", color: "#94a3b8", padding: "2px 7px", borderRadius: 4, fontFamily: "monospace" }}>{preset.data.customer_id}</span>
                          <span style={{ fontSize: 11, color: preset.data.type === "credit" ? "#22c55e" : "#94a3b8" }}>{preset.data.type === "credit" ? "+" : "-"}₹{Math.abs(preset.data.amount).toLocaleString()}</span>
                          <span style={{ fontSize: 11, color: "#475569" }}>{preset.data.category}</span>
                        </div>
                      </div>
                      <button onClick={() => sendTransaction(preset.data)} disabled={sending}
                        style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: sending ? "#1e2d4a" : "linear-gradient(135deg,#1a56db,#0ea5e9)", color: sending ? "#475569" : "#fff", fontSize: 12, fontWeight: 600, cursor: sending ? "default" : "pointer", flexShrink: 0 }}>
                        {sending ? "Sending..." : "Push →"}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {tab === "custom" && (
                <div style={{ background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 12, padding: "1.25rem", display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 11, color: "#475569", marginBottom: 4 }}>Customer</div>
                      <select value={custom.customer_id} onChange={e => setCustom(p => ({ ...p, customer_id: e.target.value }))}
                        style={{ width: "100%", background: "#0a0f1e", border: "1px solid #1e2d4a", color: "#e2e8f0", padding: "7px 10px", borderRadius: 7, fontSize: 12, fontFamily: "inherit" }}>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.id})</option>)}
                      </select>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "#475569", marginBottom: 4 }}>Type</div>
                      <select value={custom.type} onChange={e => setCustom(p => ({ ...p, type: e.target.value }))}
                        style={{ width: "100%", background: "#0a0f1e", border: "1px solid #1e2d4a", color: "#e2e8f0", padding: "7px 10px", borderRadius: 7, fontSize: 12, fontFamily: "inherit" }}>
                        <option value="credit">Credit</option>
                        <option value="debit">Debit</option>
                      </select>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "#475569", marginBottom: 4 }}>Amount (₹)</div>
                      <input type="number" value={custom.amount} onChange={e => setCustom(p => ({ ...p, amount: Number(e.target.value) }))}
                        style={{ width: "100%", background: "#0a0f1e", border: "1px solid #1e2d4a", color: "#e2e8f0", padding: "7px 10px", borderRadius: 7, fontSize: 12, fontFamily: "inherit" }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "#475569", marginBottom: 4 }}>Category</div>
                      <select value={custom.category} onChange={e => setCustom(p => ({ ...p, category: e.target.value }))}
                        style={{ width: "100%", background: "#0a0f1e", border: "1px solid #1e2d4a", color: "#e2e8f0", padding: "7px 10px", borderRadius: 7, fontSize: 12, fontFamily: "inherit" }}>
                        {["salary","rent","grocery","emi","shopping","food","medical","baby","wedding","moving","transport","education","travel","business","transfer"].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "#475569", marginBottom: 4 }}>Description</div>
                    <input value={custom.description} onChange={e => setCustom(p => ({ ...p, description: e.target.value }))} placeholder="e.g. NEFT-INFOSYS SALARY JAN"
                      style={{ width: "100%", background: "#0a0f1e", border: "1px solid #1e2d4a", color: "#e2e8f0", padding: "7px 10px", borderRadius: 7, fontSize: 12, fontFamily: "inherit" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "#475569", marginBottom: 4 }}>Merchant</div>
                    <input value={custom.merchant} onChange={e => setCustom(p => ({ ...p, merchant: e.target.value }))} placeholder="e.g. Infosys Ltd"
                      style={{ width: "100%", background: "#0a0f1e", border: "1px solid #1e2d4a", color: "#e2e8f0", padding: "7px 10px", borderRadius: 7, fontSize: 12, fontFamily: "inherit" }} />
                  </div>
                  <button onClick={() => sendTransaction(custom)} disabled={sending || !custom.description}
                    style={{ padding: "10px", borderRadius: 8, border: "none", background: sending || !custom.description ? "#1e2d4a" : "linear-gradient(135deg,#1a56db,#0ea5e9)", color: sending || !custom.description ? "#475569" : "#fff", fontSize: 13, fontWeight: 700, cursor: sending || !custom.description ? "default" : "pointer" }}>
                    {sending ? "⚡ Processing..." : "Push Transaction →"}
                  </button>
                </div>
              )}

              {/* Result */}
              {lastResult && (
                <div style={{ marginTop: "1rem", background: "#0d1629", border: `1px solid ${lastResult.status === "processed" ? "#22c55e44" : lastResult.status === "queued" ? "#f59e0b44" : "#ef444444"}`, borderRadius: 12, padding: "1.25rem" }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: lastResult.status === "processed" ? "#22c55e" : lastResult.status === "queued" ? "#f59e0b" : "#ef4444", marginBottom: 10 }}>
                    {lastResult.status === "processed" ? "✅ Transaction Processed" : lastResult.status === "queued" ? "⏳ Queued" : "❌ Error"}
                  </div>
                  {lastResult.event_detected && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 12, color: "#64748b" }}>Event detected</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: EVENT_COLOR[lastResult.event_detected] || "#94a3b8" }}>{lastResult.event_detected?.replace(/_/g, " ")}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 12, color: "#64748b" }}>Confidence</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#22c55e" }}>{Math.round((lastResult.confidence || 0) * 100)}%</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 12, color: "#64748b" }}>Recommended</span>
                        <span style={{ fontSize: 12, color: "#93c5fd" }}>{lastResult.recommended_product}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 12, color: "#64748b" }}>Action</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: lastResult.action === "pipeline_triggered" ? "#22c55e" : "#f59e0b" }}>{lastResult.action?.replace(/_/g, " ")}</span>
                      </div>
                    </div>
                  )}
                  {lastResult.error && <div style={{ fontSize: 12, color: "#ef4444" }}>{lastResult.error}</div>}
                </div>
              )}
            </div>

            {/* Right: webhook queue */}
            <div>
              <div style={{ background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 12, padding: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "#f1f5f9" }}>Webhook Queue</div>
                  <button onClick={fetchQueue} style={{ fontSize: 11, color: "#60a5fa", background: "none", border: "none", cursor: "pointer" }}>↺ Refresh</button>
                </div>
                {queue.length === 0 ? (
                  <div style={{ textAlign: "center", color: "#334155", fontSize: 12, padding: "2rem 0" }}>
                    <div style={{ fontSize: 24, marginBottom: 6 }}>📡</div>
                    No transactions yet
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 500, overflowY: "auto" }}>
                    {[...queue].reverse().map((item, i) => (
                      <div key={i} style={{ background: "#0a0f1e", borderRadius: 8, padding: "8px 10px", borderLeft: `3px solid ${item.processed ? "#22c55e" : "#f59e0b"}` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: "#e2e8f0" }}>{item.customer_id}</span>
                          <span style={{ fontSize: 10, color: item.processed ? "#22c55e" : "#f59e0b" }}>{item.processed ? "✓ Processed" : "⏳ Queued"}</span>
                        </div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>{item.description?.slice(0, 40)}</div>
                        {item.event_detected && (
                          <div style={{ fontSize: 11, color: EVENT_COLOR[item.event_detected] || "#94a3b8", marginTop: 3 }}>
                            → {item.event_detected?.replace(/_/g, " ")} ({Math.round((item.confidence || 0) * 100)}%)
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* How it works */}
              <div style={{ background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 12, padding: "1.25rem", marginTop: "1rem" }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: "#f1f5f9", marginBottom: 10 }}>In Production</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { step: "1", text: "Customer makes a transaction in any SBI channel" },
                    { step: "2", text: "Finacle posts to /api/webhook/transaction in real time" },
                    { step: "3", text: "LifePulse runs behavior analysis immediately" },
                    { step: "4", text: "If confidence > 70%, pipeline triggers within seconds" },
                    { step: "5", text: "WhatsApp message sent within 6 hours (SLA)" },
                  ].map(s => (
                    <div key={s.step} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#1a56db22", border: "1px solid #1a56db44", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#60a5fa", flexShrink: 0 }}>{s.step}</div>
                      <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>{s.text}</div>
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
