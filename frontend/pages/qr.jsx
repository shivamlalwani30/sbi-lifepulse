import { useState, useEffect } from "react";
import Head from "next/head";
import Nav from "../components/Nav";

export default function QRPage() {
  const [url, setUrl] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [customUrl, setCustomUrl] = useState("");

  useEffect(() => {
    const base = window.location.origin;
    const mobileUrl = `${base}/m`;
    setUrl(mobileUrl);
    setCustomUrl(mobileUrl);
    // Use QR Server API (free, no signup)
    setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(mobileUrl)}&color=1a56db&bgcolor=0d1629&format=svg&ecc=H`);
  }, []);

  const updateQR = () => {
    if (!customUrl) return;
    setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(customUrl)}&color=1a56db&bgcolor=0d1629&format=svg&ecc=H`);
  };

  const DEMO_URLS = [
    { label: "Mobile Demo (recommended)", path: "/m" },
    { label: "Full Demo Mode", path: "/demo" },
    { label: "YONO In-App", path: "/yono" },
    { label: "Live Simulation", path: "/simulate" },
    { label: "Scale Impact", path: "/scale" },
  ];

  return (
    <>
      <Head><title>SBI LifePulse — QR Code</title></Head>
      <div style={{ minHeight: "100vh", background: "#0a0f1e", fontFamily: "'Inter',sans-serif", color: "#e2e8f0" }}>
        <Nav subtitle="QR CODE" />
        <div style={{ padding: "2rem", maxWidth: 900, margin: "0 auto" }}>

          <div style={{ marginBottom: "1.5rem" }}>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", margin: 0 }}>Jury Phone Demo — QR Code</h1>
            <p style={{ color: "#475569", fontSize: 13, margin: "4px 0 0" }}>
              Show this on your presentation slide. Jury members scan it, interact with LifePulse on their own phone — live.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "2rem", alignItems: "start" }}>

            {/* QR Code */}
            <div style={{ background: "#0d1629", border: "1px solid #1a56db44", borderRadius: 16, padding: "1.5rem", textAlign: "center", minWidth: 280 }}>
              <div style={{ marginBottom: 10 }}>
                {qrUrl && (
                  <img src={qrUrl} alt="QR Code" width={280} height={280}
                    style={{ borderRadius: 8, display: "block" }}
                    onError={(e) => { e.target.style.display = "none"; }} />
                )}
              </div>
              <div style={{ fontSize: 11, color: "#475569", marginTop: 8 }}>Scan to open LifePulse</div>
              <div style={{ fontSize: 10, color: "#334155", marginTop: 4, wordBreak: "break-all", fontFamily: "monospace" }}>{url}</div>

              {/* SBI branding */}
              <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <div style={{ width: 20, height: 20, background: "linear-gradient(135deg,#1a56db,#0ea5e9)", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>⚡</div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#60a5fa" }}>SBI LifePulse</span>
              </div>
            </div>

            {/* Right side */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

              {/* URL selector */}
              <div style={{ background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 12, padding: "1.25rem" }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#f1f5f9", marginBottom: "1rem" }}>Choose Demo Page</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: "1rem" }}>
                  {DEMO_URLS.map(d => {
                    const full = `${typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}${d.path}`;
                    return (
                      <button key={d.path} onClick={() => {
                        setCustomUrl(full);
                        setUrl(full);
                        setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(full)}&color=1a56db&bgcolor=0d1629&format=svg&ecc=H`);
                      }}
                        style={{ padding: "8px 12px", borderRadius: 7, border: `1px solid ${url === full ? "#1a56db" : "#1e2d4a"}`, background: url === full ? "#1a56db22" : "transparent", color: url === full ? "#60a5fa" : "#64748b", fontSize: 12, fontWeight: url === full ? 600 : 400, cursor: "pointer", textAlign: "left" }}>
                        {url === full ? "✓ " : ""}{d.label}
                        <span style={{ fontSize: 10, marginLeft: 6, opacity: 0.5 }}>{d.path}</span>
                      </button>
                    );
                  })}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <input value={customUrl} onChange={e => setCustomUrl(e.target.value)}
                    placeholder="Or enter custom URL..."
                    style={{ flex: 1, background: "#0a0f1e", border: "1px solid #1e2d4a", color: "#e2e8f0", padding: "7px 10px", borderRadius: 7, fontSize: 12, fontFamily: "inherit" }} />
                  <button onClick={updateQR}
                    style={{ padding: "7px 14px", borderRadius: 7, border: "none", background: "#1a56db", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    Generate
                  </button>
                </div>
              </div>

              {/* How to use in pitch */}
              <div style={{ background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 12, padding: "1.25rem" }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#f1f5f9", marginBottom: "1rem" }}>🎯 How to Use This at GFF</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    { step: "1", text: "Add this QR code to your Slide 4 (Live Demo slide)", color: "#3b82f6" },
                    { step: "2", text: "Ask a jury member to scan it with their phone camera", color: "#a855f7" },
                    { step: "3", text: "They pick a customer (e.g. Priya Sharma) and tap ▶ Run", color: "#f59e0b" },
                    { step: "4", text: "They watch the pipeline fire and receive the WhatsApp message", color: "#22c55e" },
                    { step: "5", text: "They reply 'haan kar do' — SIP enrolled in 60 seconds", color: "#ec4899" },
                  ].map(s => (
                    <div key={s.step} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <div style={{ width: 22, height: 22, borderRadius: "50%", background: s.color + "22", border: `1px solid ${s.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: s.color, flexShrink: 0 }}>{s.step}</div>
                      <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.5 }}>{s.text}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Print tip */}
              <div style={{ background: "#f59e0b11", border: "1px solid #f59e0b33", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#f59e0b" }}>
                💡 <strong>Tip:</strong> QR codes only work if your laptop and the jury's phone are on the same network, OR you use a public URL. For GFF: run{" "}
              <code style={{ background: "#0a0f1e", padding: "1px 5px", borderRadius: 3, fontSize: 11 }}>npx ngrok http 3000</code>{" "}
              and paste the https:// URL above. Screenshot and embed in slide 4.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
