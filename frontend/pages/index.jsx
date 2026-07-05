import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import Link from "next/link";
import CustomerCard from "../components/CustomerCard";
import OnboardingTour from "../components/OnboardingTour";
import EventFeed from "../components/EventFeed";
import WhatsAppChat from "../components/WhatsAppChat";
import CompliancePanel from "../components/CompliancePanel";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function Dashboard() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [events, setEvents] = useState([]);
  const [sessions, setSessions] = useState({});
  const [activeView, setActiveView] = useState("dashboard");
  const [chatSession, setChatSession] = useState(null);
  const [pipelineRunning, setPipelineRunning] = useState(null);
  const [runAllActive, setRunAllActive] = useState(false);
  const eventSourceRef = useRef(null);

  useEffect(() => {
    fetch(`${API}/api/customers`)
      .then((r) => r.json())
      .then((data) => { setCustomers(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const runPipeline = (customer) => {
    setSelectedCustomer(customer);
    setPipelineRunning(customer.id);
    setEvents((prev) => [
      ...prev,
      { type: "status", payload: { message: `▶ Starting pipeline for ${customer.name}...` }, ts: new Date().toLocaleTimeString() }
    ]);

    if (eventSourceRef.current) eventSourceRef.current.close();

    const es = new EventSource(`${API}/api/pipeline/${customer.id}/stream`);
    eventSourceRef.current = es;

    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      setEvents((prev) => [...prev, { ...data, ts: new Date().toLocaleTimeString() }]);

      if (data.type === "complete") {
        setSessions((prev) => ({
          ...prev,
          [customer.id]: {
            event: data.payload.event,
            confidence: data.payload.confidence,
            product: data.payload.product,
            whatsapp_message: data.payload.whatsapp_message,
            enrollment_status: "pending",
          },
        }));
        setPipelineRunning(null);
        es.close();
      }
      if (data.type === "error") {
        setPipelineRunning(null);
        es.close();
      }
    };

    es.onerror = () => { setPipelineRunning(null); es.close(); };
  };

  const runAll = async () => {
    if (runAllActive) return;
    setRunAllActive(true);
    setEvents([{ type: "status", payload: { message: "🚀 Running full pipeline for all customers..." }, ts: new Date().toLocaleTimeString() }]);

    for (const customer of customers) {
      await new Promise((resolve) => {
        setSelectedCustomer(customer);
        setPipelineRunning(customer.id);

        const es = new EventSource(`${API}/api/pipeline/${customer.id}/stream`);
        es.onmessage = (e) => {
          const data = JSON.parse(e.data);
          setEvents((prev) => [...prev, { ...data, customerName: customer.name, ts: new Date().toLocaleTimeString() }]);
          if (data.type === "complete" || data.type === "error") {
            if (data.type === "complete") {
              setSessions((prev) => ({
                ...prev,
                [customer.id]: {
                  event: data.payload.event,
                  confidence: data.payload.confidence,
                  product: data.payload.product,
                  whatsapp_message: data.payload.whatsapp_message,
                  enrollment_status: "pending",
                },
              }));
            }
            setPipelineRunning(null);
            es.close();
            resolve();
          }
        };
        es.onerror = () => { setPipelineRunning(null); es.close(); resolve(); };
      });
      await new Promise((r) => setTimeout(r, 400));
    }
    setRunAllActive(false);
  };

  const resetDemo = () => {
    setSessions({});
    setEvents([]);
    setSelectedCustomer(null);
    setPipelineRunning(null);
    setRunAllActive(false);
    if (eventSourceRef.current) eventSourceRef.current.close();
  };

  const openChat = (customer) => {
    const session = sessions[customer.id];
    if (!session) return;
    setChatSession({ customer, session });
    setActiveView("chat");
  };

  const updateEnrollmentStatus = (customerId, status) => {
    setSessions((prev) => ({
      ...prev,
      [customerId]: { ...prev[customerId], enrollment_status: status },
    }));
  };

  const enrolledCount = Object.values(sessions).filter(s => s.enrollment_status === "enrolled").length;
  const detectedCount = Object.keys(sessions).length;

  return (
    <>
      <Head>
        <title>SBI LifePulse — Agentic AI Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={{ minHeight: "100vh", background: "#0a0f1e", color: "#e2e8f0", fontFamily: "'Inter', sans-serif" }}>
        {/* Nav */}
        <nav style={{ background: "#0d1629", borderBottom: "1px solid #1e2d4a", padding: "0 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: 58, position: "sticky", top: 0, zIndex: 100 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 34, height: 34, background: "linear-gradient(135deg, #1a56db, #0ea5e9)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>⚡</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#fff", lineHeight: 1.2 }}>SBI LifePulse</div>
              <div style={{ fontSize: 10, color: "#64748b", letterSpacing: "0.08em" }}>AGENTIC AI · GFF 2026</div>
            </div>
          </div>

          {/* Stat pills */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <StatPill label="Monitored" value={customers.length} color="#60a5fa" />
            <StatPill label="Detected" value={detectedCount} color="#a78bfa" />
            <StatPill label="Enrolled" value={enrolledCount} color="#22c55e" />
          </div>

          {/* Nav buttons */}
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {activeView !== "dashboard" && (
              <button onClick={() => setActiveView("dashboard")} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #1e2d4a", background: "transparent", color: "#94a3b8", fontSize: 12, cursor: "pointer" }}>
                ← Dashboard
              </button>
            )}
            <Link href="/batch" style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #1e2d4a", background: "transparent", color: "#94a3b8", fontSize: 11, textDecoration: "none" }}>⚡ Batch</Link>
            <Link href="/analytics" style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #1e2d4a", background: "transparent", color: "#94a3b8", fontSize: 11, textDecoration: "none" }}>📊 Analytics</Link>
            <Link href="/scale" style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #1e2d4a", background: "transparent", color: "#94a3b8", fontSize: 11, textDecoration: "none" }}>📐 Scale</Link>
            <Link href="/feedback" style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #1e2d4a", background: "transparent", color: "#94a3b8", fontSize: 11, textDecoration: "none" }}>🧠 Feedback</Link>
            <Link href="/yono" style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #1e2d4a", background: "transparent", color: "#94a3b8", fontSize: 11, textDecoration: "none" }}>📱 YONO</Link>
            <button onClick={() => setActiveView("compliance")} style={{ padding: "6px 10px", borderRadius: 6, border: "none", background: activeView === "compliance" ? "#1a56db" : "#1e2d4a", color: "#fff", fontSize: 11, cursor: "pointer", fontWeight: 500 }}>
              🛡️ Compliance
            </button>
            <Link href="/demo" style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: "linear-gradient(135deg, #1a56db, #0ea5e9)", color: "#fff", fontSize: 12, textDecoration: "none", fontWeight: 600 }}>▶ Demo</Link>
          </div>
        </nav>

        {/* Onboarding Tour */}
        <OnboardingTour />

        {/* Dashboard View */}
        {activeView === "dashboard" && (
          <div style={{ display: "flex", height: "calc(100vh - 58px)" }}>

            {/* Main content */}
            <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }}>

              {/* Action bar */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <div>
                  <h1 style={{ fontSize: 20, fontWeight: 700, color: "#f1f5f9", margin: 0 }}>Customer Intelligence</h1>
                  <p style={{ color: "#475569", fontSize: 13, margin: "3px 0 0" }}>
                    {customers.length} customers · Real-time agentic pipeline
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={resetDemo}
                    style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #1e2d4a", background: "transparent", color: "#64748b", fontSize: 13, cursor: "pointer", fontWeight: 500 }}
                  >
                    ↺ Reset Demo
                  </button>
                  <button
                    onClick={runAll}
                    disabled={runAllActive || loading}
                    style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: runAllActive ? "#1e2d4a" : "linear-gradient(135deg, #1a56db, #0ea5e9)", color: runAllActive ? "#64748b" : "#fff", fontSize: 13, cursor: runAllActive ? "default" : "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}
                  >
                    {runAllActive ? "⚡ Running All..." : "🚀 Run All Pipelines"}
                  </button>
                </div>
              </div>

              {/* Customer grid */}
              {loading ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
                  {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
                  {customers.map((c) => (
                    <CustomerCard
                      key={c.id}
                      customer={c}
                      session={sessions[c.id]}
                      isRunning={pipelineRunning === c.id}
                      onRunPipeline={() => runPipeline(c)}
                      onOpenChat={() => openChat(c)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Event Feed Sidebar */}
            <div style={{ width: 320, background: "#0d1629", borderLeft: "1px solid #1e2d4a", overflowY: "auto", flexShrink: 0 }}>
              <EventFeed events={events} selectedCustomer={selectedCustomer} />
            </div>
          </div>
        )}

        {/* WhatsApp Chat View */}
        {activeView === "chat" && chatSession && (
          <WhatsAppChat
            customer={chatSession.customer}
            session={chatSession.session}
            onBack={() => setActiveView("dashboard")}
            onEnrollmentUpdate={(status) => {
              updateEnrollmentStatus(chatSession.customer.id, status);
              setChatSession((prev) => ({ ...prev, session: { ...prev.session, enrollment_status: status } }));
            }}
            api={API}
          />
        )}

        {/* Compliance View */}
        {activeView === "compliance" && (
          <CompliancePanel
            customers={customers}
            sessions={sessions}
            api={API}
            onBack={() => setActiveView("dashboard")}
          />
        )}
      </div>
    </>
  );
}

function StatPill({ label, value, color }) {
  return (
    <div style={{ background: "#0a0f1e", border: "1px solid #1e2d4a", borderRadius: 8, padding: "4px 12px", textAlign: "center", minWidth: 60 }}>
      <div style={{ fontSize: 16, fontWeight: 700, color, lineHeight: 1.2 }}>{value}</div>
      <div style={{ fontSize: 10, color: "#475569", letterSpacing: "0.04em" }}>{label}</div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div style={{ background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 12, padding: "1.25rem", height: 200 }}>
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#1e2d4a", animation: "pulse 1.5s ease-in-out infinite" }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: 14, background: "#1e2d4a", borderRadius: 4, marginBottom: 6, width: "60%", animation: "pulse 1.5s ease-in-out infinite" }} />
          <div style={{ height: 11, background: "#1e2d4a", borderRadius: 4, width: "40%", animation: "pulse 1.5s ease-in-out infinite" }} />
        </div>
      </div>
      <div style={{ height: 40, background: "#1e2d4a", borderRadius: 6, marginBottom: 12, animation: "pulse 1.5s ease-in-out infinite" }} />
      <div style={{ height: 34, background: "#1e2d4a", borderRadius: 8, animation: "pulse 1.5s ease-in-out infinite" }} />
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}
