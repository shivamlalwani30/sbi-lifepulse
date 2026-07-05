import { useState, useEffect } from "react";

const DPDP_CHECKLIST = [
  { id: 1, item: "Explicit consent obtained before any data processing", ref: "DPDP Act §6" },
  { id: 2, item: "Customer opt-out mechanism available at all times", ref: "DPDP Act §13" },
  { id: 3, item: "No raw personal data shared with third parties", ref: "DPDP Act §8(3)" },
  { id: 4, item: "Inference runs only on anonymized behavioral patterns", ref: "DPDP Act §4" },
  { id: 5, item: "Full audit log maintained for every customer interaction", ref: "DPDP Act §11" },
  { id: 6, item: "Data retention limited to active engagement period only", ref: "DPDP Act §8(7)" },
  { id: 7, item: "RBI digital communication guidelines followed", ref: "RBI Circular 2023" },
  { id: 8, item: "Customer notified of AI-driven outreach in privacy policy", ref: "DPDP Act §5" },
];

export default function CompliancePanel({ customers, sessions, api, onBack }) {
  const [auditLog, setAuditLog] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${api}/api/compliance/audit`)
      .then((r) => r.json())
      .then((d) => { setAuditLog(d.audit_log || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const enrolled = auditLog.filter((r) => r.enrollment_status === "enrolled").length;
  const optedOut = auditLog.filter((r) => r.enrollment_status === "opted_out").length;
  const consentedCustomers = customers.filter((c) => c.consent?.opted_in).length;

  const statusColor = { enrolled: "#22c55e", opted_out: "#ef4444", pending: "#f59e0b" };
  const statusLabel = { enrolled: "Enrolled", opted_out: "Opted Out", pending: "In Progress" };

  return (
    <div style={{ minHeight: "calc(100vh - 60px)", background: "#0a0f1e", padding: "2rem" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: "2rem" }}>
          <button onClick={onBack} style={{ background: "#0d1629", border: "1px solid #1e2d4a", color: "#94a3b8", padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>← Back</button>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#f1f5f9" }}>Compliance & Regulatory Dashboard</h2>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>DPDP Act 2023 · RBI Guidelines · Real-time Audit</p>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <span style={{ background: "#16a34a22", color: "#22c55e", fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 99 }}>● DPDP Compliant</span>
            <span style={{ background: "#1d4ed822", color: "#60a5fa", fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 99 }}>● RBI Ready</span>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
          {[
            { label: "Total Customers", value: customers.length, color: "#60a5fa" },
            { label: "Consent Obtained", value: consentedCustomers, color: "#22c55e" },
            { label: "Successfully Enrolled", value: enrolled, color: "#a78bfa" },
            { label: "Opted Out", value: optedOut, color: "#f87171" },
          ].map((s) => (
            <div key={s.label} style={{ background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 10, padding: "1rem 1.25rem" }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>

          {/* DPDP Checklist */}
          <div style={{ background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 12, padding: "1.25rem" }}>
            <div style={{ fontWeight: 600, fontSize: 15, color: "#f1f5f9", marginBottom: "1rem", display: "flex", alignItems: "center", gap: 8 }}>
              <span>🛡️</span> DPDP Act 2023 Compliance
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {DPDP_CHECKLIST.map((item) => (
                <div key={item.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 10px", background: "#0a0f1e", borderRadius: 8 }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#16a34a22", border: "1px solid #22c55e", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                    <span style={{ color: "#22c55e", fontSize: 11 }}>✓</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: "#e2e8f0", lineHeight: 1.4 }}>{item.item}</div>
                    <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{item.ref}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Consent Status per customer */}
          <div style={{ background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 12, padding: "1.25rem" }}>
            <div style={{ fontWeight: 600, fontSize: 15, color: "#f1f5f9", marginBottom: "1rem", display: "flex", alignItems: "center", gap: 8 }}>
              <span>✅</span> Customer Consent Status
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {customers.map((c) => {
                const session = sessions[c.id];
                return (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#0a0f1e", borderRadius: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#1e2d4a", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#60a5fa", fontSize: 13, flexShrink: 0 }}>
                      {c.name.charAt(0)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "#e2e8f0" }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: "#475569" }}>Via {c.consent?.channel} · {c.consent?.consent_date}</div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: c.consent?.opted_in ? "#16a34a22" : "#dc262622", color: c.consent?.opted_in ? "#22c55e" : "#f87171", fontWeight: 600 }}>
                        {c.consent?.opted_in ? "Opted In" : "Opted Out"}
                      </span>
                      {session?.enrollment_status && (
                        <span style={{ fontSize: 11, color: statusColor[session.enrollment_status] }}>
                          {statusLabel[session.enrollment_status] || session.enrollment_status}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Audit Log */}
        <div style={{ background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 12, padding: "1.25rem", marginTop: "1.5rem" }}>
          <div style={{ fontWeight: 600, fontSize: 15, color: "#f1f5f9", marginBottom: "1rem", display: "flex", alignItems: "center", gap: 8 }}>
            <span>📋</span> Audit Log
            <span style={{ fontSize: 12, color: "#64748b", fontWeight: 400 }}>— All agent actions recorded</span>
          </div>
          {loading ? (
            <div style={{ color: "#475569", fontSize: 13, padding: "1rem" }}>Loading audit records...</div>
          ) : auditLog.length === 0 ? (
            <div style={{ color: "#475569", fontSize: 13, padding: "1rem" }}>No audit records yet. Run a pipeline to generate entries.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #1e2d4a" }}>
                    {["Customer", "Consent", "Event Detected", "Product Offered", "Outreach Sent", "Status", "DPDP"].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "#64748b", fontWeight: 500, fontSize: 12 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {auditLog.map((row, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #0a0f1e" }}>
                      <td style={{ padding: "10px 12px", color: "#e2e8f0" }}>{row.customer_name}</td>
                      <td style={{ padding: "10px 12px", color: row.consent_status ? "#22c55e" : "#f87171" }}>
                        {row.consent_status ? "✓ Yes" : "✗ No"}
                      </td>
                      <td style={{ padding: "10px 12px", color: "#93c5fd" }}>{row.event_detected?.replace(/_/g, " ")}</td>
                      <td style={{ padding: "10px 12px", color: "#c4b5fd" }}>{row.product_offered}</td>
                      <td style={{ padding: "10px 12px", color: "#22c55e" }}>{row.outreach_sent ? "✓ Yes" : "—"}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ color: statusColor[row.enrollment_status], fontWeight: 500 }}>
                          {statusLabel[row.enrollment_status] || row.enrollment_status}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px", color: "#22c55e" }}>{row.dpdp_compliant ? "✓" : "✗"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
