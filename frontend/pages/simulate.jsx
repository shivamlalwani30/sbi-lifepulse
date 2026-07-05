import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import Nav from "../components/Nav";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Synthetic customer generator
const NAMES = [
  "Aarav Sharma","Diya Patel","Rohit Gupta","Sneha Rao","Karan Mehta",
  "Pooja Singh","Vivek Kumar","Anita Joshi","Nikhil Das","Kavitha Nair",
  "Sanjay Verma","Ritu Agarwal","Manish Tiwari","Preethi Iyer","Aryan Shah",
  "Divya Pillai","Harish Reddy","Meghna Jain","Vikrant Mishra","Swati Bose",
];
const CITIES = ["Mumbai","Delhi","Bengaluru","Hyderabad","Chennai","Pune","Kolkata","Jaipur","Kochi","Lucknow","Surat","Patna"];
const EVENTS = [
  { type: "salary_hike",       label: "Salary Hike",    color: "#22c55e", emoji: "📈", product: "SIP Enrollment" },
  { type: "city_relocation",   label: "Relocation",     color: "#3b82f6", emoji: "🏙️", product: "Card Upgrade" },
  { type: "new_emi_detected",  label: "New EMI",        color: "#f59e0b", emoji: "🏠", product: "Term Insurance" },
  { type: "insurance_gap",     label: "Insurance Gap",  color: "#ef4444", emoji: "🛡️", product: "Smart Protect" },
  { type: "marriage_detected", label: "Marriage",       color: "#a855f7", emoji: "💍", product: "Joint Account" },
  { type: "new_baby_detected", label: "New Baby",       color: "#ec4899", emoji: "👶", product: "Child Plan" },
];

let idCounter = 1000;
function generateCustomer() {
  const name = NAMES[Math.floor(Math.random() * NAMES.length)];
  const city = CITIES[Math.floor(Math.random() * CITIES.length)];
  const event = EVENTS[Math.floor(Math.random() * EVENTS.length)];
  const confidence = 0.72 + Math.random() * 0.25;
  const enrolled = Math.random() > 0.35;
  idCounter++;
  return {
    id: `SIM${idCounter}`,
    name,
    city,
    event,
    confidence: Math.round(confidence * 100),
    enrolled,
    ts: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    processingMs: Math.floor(3200 + Math.random() * 5800),
  };
}

const STAGES = ["🔍 Scanning txns","📊 Signals extracted","⚡ Event classified","✍️ Message generated","📲 WhatsApp sent","✅ Enrolled"];

export default function SimulatePage() {
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(2000); // ms between customers
  const [feed, setFeed] = useState([]);
  const [stats, setStats] = useState({ total: 0, enrolled: 0, events: {} });
  const [currentProcessing, setCurrentProcessing] = useState(null);
  const [stage, setStage] = useState(0);
  const [totalSimulated, setTotalSimulated] = useState(0);
  const intervalRef = useRef(null);
  const stageRef = useRef(null);
  const feedRef = useRef(null);

  const processCustomer = async () => {
    const customer = generateCustomer();
    setCurrentProcessing(customer);
    setStage(0);

    // Animate through stages
    for (let i = 0; i < STAGES.length; i++) {
      setStage(i);
      await new Promise(r => setTimeout(r, speed / STAGES.length));
    }

    setFeed(prev => [customer, ...prev.slice(0, 49)]);
    setStats(prev => ({
      total: prev.total + 1,
      enrolled: prev.enrolled + (customer.enrolled ? 1 : 0),
      events: {
        ...prev.events,
        [customer.event.type]: (prev.events[customer.event.type] || 0) + 1,
      },
    }));
    setTotalSimulated(n => n + 1);
    setCurrentProcessing(null);
  };

  useEffect(() => {
    if (running) {
      processCustomer();
      intervalRef.current = setInterval(processCustomer, speed + 200);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, speed]);

  const convRate = stats.total > 0 ? Math.round((stats.enrolled / stats.total) * 100) : 0;
  const projectedHourly = Math.floor((3600000 / (speed + 200)));
  const projectedDaily = projectedHourly * 24;

  return (
    <>
      <Head><title>SBI LifePulse — Live Simulation</title></Head>
      <div style={{ minHeight: "100vh", background: "#0a0f1e", fontFamily: "'Inter',sans-serif", color: "#e2e8f0" }}>
        <Nav subtitle="LIVE SIMULATION" />

        <div style={{ display: "grid", gridTemplateColumns: "260px 1fr 300px", height: "calc(100vh - 52px)" }}>

          {/* Left: Controls */}
          <div style={{ background: "#0d1629", borderRight: "1px solid #1e2d4a", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Simulation Control</div>

              {/* Speed */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: "#64748b" }}>Processing speed</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#60a5fa" }}>
                    {speed <= 500 ? "Turbo" : speed <= 1500 ? "Fast" : speed <= 3000 ? "Normal" : "Slow"}
                  </span>
                </div>
                <input type="range" min={300} max={5000} step={100} value={speed}
                  onChange={e => setSpeed(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "#1a56db" }} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
                  <span style={{ fontSize: 10, color: "#334155" }}>Turbo</span>
                  <span style={{ fontSize: 10, color: "#334155" }}>Slow</span>
                </div>
              </div>

              {/* Start/Stop */}
              <button onClick={() => setRunning(r => !r)} style={{
                width: "100%", padding: "10px", borderRadius: 8, border: "none", cursor: "pointer",
                background: running ? "#dc2626" : "linear-gradient(135deg,#1a56db,#0ea5e9)",
                color: "#fff", fontSize: 13, fontWeight: 700,
              }}>
                {running ? "⏹ Stop Simulation" : "▶ Start Simulation"}
              </button>

              <button onClick={() => { setFeed([]); setStats({ total: 0, enrolled: 0, events: {} }); setTotalSimulated(0); }}
                style={{ width: "100%", padding: "7px", borderRadius: 8, border: "1px solid #1e2d4a", background: "transparent", color: "#64748b", fontSize: 12, cursor: "pointer", marginTop: 6 }}>
                ↺ Reset
              </button>
            </div>

            {/* Stats */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "Customers Processed", value: stats.total.toLocaleString(), color: "#60a5fa" },
                { label: "Enrolled", value: stats.enrolled.toLocaleString(), color: "#22c55e" },
                { label: "Conversion Rate", value: `${convRate}%`, color: "#f59e0b" },
                { label: "Speed (per hour)", value: projectedHourly.toLocaleString(), color: "#a78bfa" },
                { label: "Speed (per day)", value: projectedDaily.toLocaleString(), color: "#94a3b8" },
              ].map(s => (
                <div key={s.label} style={{ background: "#0a0f1e", borderRadius: 8, padding: "8px 10px", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, color: "#475569" }}>{s.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.value}</span>
                </div>
              ))}
            </div>

            {/* Scale callout */}
            <div style={{ background: "#1a56db11", border: "1px solid #1a56db33", borderRadius: 8, padding: "10px" }}>
              <div style={{ fontSize: 11, color: "#60a5fa", fontWeight: 600, marginBottom: 4 }}>At SBI Scale</div>
              <div style={{ fontSize: 11, color: "#475569", lineHeight: 1.6 }}>
                Running on 500M customers at this throughput, LifePulse would process the full customer base in <span style={{ color: "#f1f5f9", fontWeight: 600 }}>~14 days</span> with a single server. With Kubernetes HPA, in <span style={{ color: "#22c55e", fontWeight: 600 }}>hours</span>.
              </div>
            </div>
          </div>

          {/* Center: Pipeline visualizer */}
          <div style={{ display: "flex", flexDirection: "column", padding: "1.5rem" }}>

            {/* Currently processing */}
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Agent Pipeline — Now Processing</div>

              {currentProcessing ? (
                <div style={{ background: "#0d1629", border: "1px solid #1a56db44", borderRadius: 12, padding: "1.25rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9" }}>{currentProcessing.name}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{currentProcessing.city} · SIM{currentProcessing.id}</div>
                    </div>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#1a56db", animation: "pulse 1s ease-in-out infinite" }} />
                  </div>

                  {/* Stage progress */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6 }}>
                    {STAGES.map((s, i) => (
                      <div key={i} style={{ textAlign: "center" }}>
                        <div style={{ height: 32, borderRadius: 6, background: i < stage ? "#22c55e22" : i === stage ? "#1a56db22" : "#1e2d4a", border: `1px solid ${i < stage ? "#22c55e44" : i === stage ? "#1a56db" : "#1e2d4a"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, marginBottom: 4, transition: "all 0.3s" }}>
                          {i < stage ? "✓" : i === stage ? <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⚡</span> : "○"}
                        </div>
                        <div style={{ fontSize: 9, color: i <= stage ? "#94a3b8" : "#334155", lineHeight: 1.3 }}>{s.replace(/[^\w\s]/g,"").trim()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 12, padding: "2rem", textAlign: "center", color: "#334155" }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>⚡</div>
                  <div style={{ fontSize: 13 }}>{running ? "Waiting for next customer..." : "Press Start to begin simulation"}</div>
                </div>
              )}
            </div>

            {/* Event distribution bars */}
            {stats.total > 0 && (
              <div style={{ background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 12, padding: "1.25rem", marginBottom: "1.5rem" }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: "#f1f5f9", marginBottom: "1rem" }}>Life Event Distribution (live)</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {EVENTS.map(evt => {
                    const count = stats.events[evt.type] || 0;
                    const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                    return (
                      <div key={evt.type}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                          <span style={{ fontSize: 11, color: evt.color }}>{evt.emoji} {evt.label}</span>
                          <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>{count} ({pct}%)</span>
                        </div>
                        <div style={{ height: 5, background: "#1e2d4a", borderRadius: 3 }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: evt.color, borderRadius: 3, transition: "width 0.4s ease" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Throughput meter */}
            <div style={{ background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 12, padding: "1.25rem" }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: "#f1f5f9", marginBottom: "1rem" }}>Throughput Projection</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                {[
                  { label: "Per Minute", value: Math.floor(projectedHourly / 60), suffix: "customers" },
                  { label: "Per Hour", value: projectedHourly.toLocaleString(), suffix: "customers" },
                  { label: "Per Day", value: projectedDaily.toLocaleString(), suffix: "customers" },
                ].map(m => (
                  <div key={m.label} style={{ background: "#0a0f1e", borderRadius: 8, padding: "0.75rem", textAlign: "center" }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#60a5fa" }}>{m.value}</div>
                    <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{m.suffix}</div>
                    <div style={{ fontSize: 10, color: "#334155" }}>{m.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 10, fontSize: 11, color: "#334155", textAlign: "center" }}>
                At 1,000 parallel pods (K8s): <span style={{ color: "#22c55e" }}>{(projectedDaily * 1000).toLocaleString()}</span> customers/day
              </div>
            </div>
          </div>

          {/* Right: Live feed */}
          <div style={{ background: "#0d1629", borderLeft: "1px solid #1e2d4a", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "1rem", borderBottom: "1px solid #1e2d4a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>Live Outreach Feed</div>
                <div style={{ fontSize: 11, color: "#475569" }}>{feed.length} events captured</div>
              </div>
              {running && <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", animation: "pulse 1s ease-in-out infinite" }} />
                <span style={{ fontSize: 11, color: "#ef4444", fontWeight: 600 }}>LIVE</span>
              </div>}
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "0.75rem" }} ref={feedRef}>
              {feed.length === 0 ? (
                <div style={{ textAlign: "center", color: "#1e2d4a", fontSize: 12, marginTop: "3rem" }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>📡</div>
                  Feed will appear here
                </div>
              ) : feed.map((item, i) => (
                <div key={item.id} style={{ marginBottom: 8, padding: "9px 10px", background: "#0a0f1e", border: `1px solid ${item.event.color}22`, borderLeft: `3px solid ${item.event.color}`, borderRadius: 8, animation: i === 0 ? "slideIn 0.3s ease" : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#f1f5f9" }}>{item.name}</span>
                    <span style={{ fontSize: 10, color: "#334155" }}>{item.ts}</span>
                  </div>
                  <div style={{ fontSize: 11, color: item.event.color }}>{item.event.emoji} {item.event.label}</div>
                  <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{item.event.product}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                    <span style={{ fontSize: 10, color: "#334155" }}>{item.confidence}% confidence</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: item.enrolled ? "#22c55e" : "#ef4444" }}>
                      {item.enrolled ? "✅ Enrolled" : "✗ Declined"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes slideIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
    </>
  );
}
