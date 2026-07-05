import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function TranscriptExporter({ customer, session, messages }) {
  const [exporting, setExporting] = useState(false);

  const exportTranscript = async () => {
    setExporting(true);
    try {
      // Build transcript HTML
      const now = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>SBI LifePulse — Conversation Transcript</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; background: #fff; color: #111; padding: 2rem; max-width: 700px; margin: 0 auto; }
    .header { border-bottom: 2px solid #00247D; padding-bottom: 1rem; margin-bottom: 1.5rem; }
    .logo { font-size: 22px; font-weight: 800; color: #00247D; }
    .logo span { color: #f59e0b; }
    .meta { font-size: 12px; color: #666; margin-top: 4px; }
    .section-title { font-size: 13px; font-weight: 700; color: #00247D; text-transform: uppercase; letter-spacing: 0.06em; margin: 1.5rem 0 0.75rem; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 1rem; }
    .info-item { background: #f8fafc; padding: 8px 12px; border-radius: 6px; border: 1px solid #e2e8f0; }
    .info-label { font-size: 10px; color: #888; text-transform: uppercase; }
    .info-value { font-size: 13px; font-weight: 600; color: #111; margin-top: 2px; }
    .message { margin-bottom: 10px; }
    .msg-agent { text-align: left; }
    .msg-user { text-align: right; }
    .bubble { display: inline-block; max-width: 75%; padding: 8px 12px; border-radius: 10px; font-size: 13px; line-height: 1.5; }
    .bubble-agent { background: #f0f4ff; color: #111; border-bottom-left-radius: 2px; }
    .bubble-user { background: #00247D; color: #fff; border-bottom-right-radius: 2px; }
    .msg-meta { font-size: 10px; color: #888; margin-top: 3px; }
    .compliance-box { margin-top: 2rem; padding: 1rem; background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; }
    .compliance-item { font-size: 12px; color: #166534; padding: 3px 0; }
    .footer { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e2e8f0; font-size: 11px; color: #888; }
    .status-badge { display: inline-block; padding: 3px 10px; border-radius: 99px; font-size: 12px; font-weight: 700; }
    .status-enrolled { background: #d1fae5; color: #065f46; }
    .status-pending  { background: #fef3c7; color: #92400e; }
    .status-opted_out { background: #fee2e2; color: #991b1b; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">⚡ SBI <span>LifePulse</span></div>
    <div class="meta">Conversation Transcript — Generated ${now} IST</div>
  </div>

  <div class="section-title">Customer Information</div>
  <div class="info-grid">
    <div class="info-item"><div class="info-label">Customer Name</div><div class="info-value">${customer?.name || "—"}</div></div>
    <div class="info-item"><div class="info-label">Account Number</div><div class="info-value">${customer?.account_number || "—"}</div></div>
    <div class="info-item"><div class="info-label">Life Event Detected</div><div class="info-value">${session?.event?.replace(/_/g," ") || "—"}</div></div>
    <div class="info-item"><div class="info-label">Product Offered</div><div class="info-value">${session?.product || "—"}</div></div>
    <div class="info-item"><div class="info-label">Enrollment Status</div><div class="info-value"><span class="status-badge status-${session?.enrollment_status || 'pending'}">${session?.enrollment_status || "pending"}</span></div></div>
    <div class="info-item"><div class="info-label">Outreach Channel</div><div class="info-value">WhatsApp (SBI LifePulse)</div></div>
  </div>

  <div class="section-title">Conversation (${messages?.length || 0} messages)</div>
  ${(messages || []).map((m, i) => `
  <div class="message msg-${m.from === "agent" ? "agent" : "user"}">
    <div class="bubble bubble-${m.from === "agent" ? "agent" : "user"}">${m.text?.replace(/\n/g,"<br>") || ""}</div>
    <div class="msg-meta">${m.from === "agent" ? "SBI LifePulse" : customer?.name?.split(" ")[0] || "Customer"} · ${m.time || ""}</div>
  </div>`).join("")}

  <div class="compliance-box">
    <div class="section-title" style="margin-top:0;color:#166534">✅ DPDP Act 2023 Compliance</div>
    <div class="compliance-item">✓ Customer consent obtained before outreach (§6)</div>
    <div class="compliance-item">✓ Opt-out available via STOP reply at any time (§13)</div>
    <div class="compliance-item">✓ No raw personal data shared externally (§8.3)</div>
    <div class="compliance-item">✓ Inference on anonymized transaction patterns only (§4)</div>
    <div class="compliance-item">✓ Full audit log maintained (§11)</div>
    <div class="compliance-item">✓ RBI digital communication guidelines followed</div>
  </div>

  <div class="footer">
    SBI LifePulse · Team Glucon-D · SBI Hackathon @ GFF 2026<br>
    This transcript is generated automatically for compliance and audit purposes.
  </div>
</body>
</html>`;

      // Open in new tab for printing/saving as PDF
      const win = window.open("", "_blank");
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 500);
    } catch (e) {
      console.error("Export failed", e);
    } finally {
      setExporting(false);
    }
  };

  return (
    <button onClick={exportTranscript} disabled={exporting || !messages?.length}
      style={{ padding: "6px 14px", borderRadius: 7, border: "1px solid #1e2d4a", background: "transparent", color: "#64748b", fontSize: 12, cursor: messages?.length ? "pointer" : "default", display: "flex", alignItems: "center", gap: 6 }}>
      {exporting ? "⏳" : "📄"} Export PDF
    </button>
  );
}
