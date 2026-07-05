import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import Nav from "../components/Nav";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function EligibilityPage() {
  const [customers, setCustomers] = useState([]);
  const [selected, setSelected] = useState("CUST001");
  const [products, setProducts] = useState([]);
  const [best, setBest] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/customers`).then(r => r.json()).then(setCustomers).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    Promise.all([
      fetch(`${API}/api/eligibility/${selected}`).then(r => r.json()),
      fetch(`${API}/api/eligibility/${selected}/best`).then(r => r.json()),
    ]).then(([e, b]) => {
      setProducts(e.products || []);
      setBest(b);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [selected]);

  const eligible = products.filter(p => p.eligible);
  const ineligible = products.filter(p => !p.eligible);

  return (
    <>
      <Head><title>SBI LifePulse — Eligibility Checker</title></Head>
      <div style={{ minHeight: "100vh", background: "#0a0f1e", fontFamily: "'Inter',sans-serif", color: "#e2e8f0" }}>
        <Nav subtitle="ELIGIBILITY CHECKER" />
        <div style={{ padding: "1.5rem 2rem", maxWidth: 1000, margin: "0 auto" }}>

          <div style={{ marginBottom: "1.5rem" }}>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", margin: 0 }}>Product Eligibility Pre-Check</h1>
            <p style={{ color: "#475569", fontSize: 13, margin: "4px 0 0" }}>
              Runs between Agent 2 and Agent 3. Prevents offering products the customer doesn't qualify for — zero rejection UX.
            </p>
          </div>

          {/* Customer selector */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: "1.5rem" }}>
            {customers.map(c => (
              <button key={c.id} onClick={() => setSelected(c.id)}
                style={{ padding: "6px 12px", borderRadius: 7, border: `1px solid ${selected === c.id ? "#1a56db" : "#1e2d4a"}`, background: selected === c.id ? "#1a56db22" : "transparent", color: selected === c.id ? "#60a5fa" : "#64748b", fontSize: 12, fontWeight: selected === c.id ? 600 : 400, cursor: "pointer" }}>
                {c.name.split(" ")[0]} <span style={{ fontSize: 10, opacity: 0.6 }}>{c.city}</span>
              </button>
            ))}
          </div>

          {/* Best product recommendation */}
          {best && (
            <div style={{ background: best.is_fallback ? "#f59e0b11" : "#22c55e11", border: `1px solid ${best.is_fallback ? "#f59e0b44" : "#22c55e44"}`, borderRadius: 12, padding: "1.25rem", marginBottom: "1.5rem", display: "flex", gap: 12, alignItems: "center" }}>
              <span style={{ fontSize: 28 }}>{best.is_fallback ? "⚡" : "✅"}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#f1f5f9" }}>
                  {best.is_fallback ? "Fallback Applied" : "Primary Product Eligible"}
                </div>
                <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 2 }}>
                  Agent 3 will offer: <strong style={{ color: best.is_fallback ? "#f59e0b" : "#22c55e" }}>{best.selected_product_name}</strong>
                  {best.is_fallback && ` (original: ${best.original_product} not eligible)`}
                </div>
                {best.fallbacks_tried?.length > 0 && (
                  <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>
                    Tried: {best.fallbacks_tried.map(f => f.product).join(" → ")}
                  </div>
                )}
              </div>
              <div style={{ fontSize: 12, background: "#1e2d4a", padding: "4px 12px", borderRadius: 99, color: "#94a3b8" }}>
                {best.selected_product}
              </div>
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: "center", color: "#475569", padding: "3rem" }}>Checking eligibility...</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
              {/* Eligible */}
              <div style={{ background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 12, padding: "1.25rem" }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: "#22c55e", marginBottom: "1rem" }}>
                  ✅ Eligible ({eligible.length} products)
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {eligible.map(p => (
                    <div key={p.product_code} style={{ background: "#0a0f1e", borderRadius: 8, padding: "8px 12px", borderLeft: "3px solid #22c55e" }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#f1f5f9" }}>{p.product_name}</div>
                      <div style={{ fontSize: 10, color: "#334155", marginTop: 2, fontFamily: "monospace" }}>{p.product_code}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Not eligible */}
              <div style={{ background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 12, padding: "1.25rem" }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: "#ef4444", marginBottom: "1rem" }}>
                  ❌ Not Eligible ({ineligible.length} products)
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {ineligible.map(p => (
                    <div key={p.product_code} style={{ background: "#0a0f1e", borderRadius: 8, padding: "8px 12px", borderLeft: "3px solid #ef4444" }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#f1f5f9", marginBottom: 4 }}>{p.product_name}</div>
                      {p.failures?.map((f, i) => (
                        <div key={i} style={{ fontSize: 11, color: "#ef4444", display: "flex", gap: 4 }}>
                          <span>→</span><span>{f}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Eligibility rules explainer */}
          <div style={{ background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 12, padding: "1.25rem", marginTop: "1.5rem" }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: "#f1f5f9", marginBottom: "1rem" }}>How Eligibility Checking Works</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { icon: "1️⃣", title: "Agent 2 detects life event", desc: "e.g. salary_hike → recommends SIP_2000" },
                { icon: "2️⃣", title: "Eligibility pre-check runs", desc: "Validates age, income, credit score, KYC, existing products" },
                { icon: "3️⃣", title: "Fallback chain if not eligible", desc: "e.g. CARD_UPGRADE fails → tries SIP_2000 → tries SAVINGS_OPT" },
                { icon: "4️⃣", title: "Agent 3 gets eligible product", desc: "Generates personalized message for the right product only" },
              ].map((s, i) => (
                <div key={i} style={{ background: "#0a0f1e", borderRadius: 8, padding: "10px 12px", display: "flex", gap: 10 }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{s.icon}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#f1f5f9" }}>{s.title}</div>
                    <div style={{ fontSize: 11, color: "#475569", marginTop: 3 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
