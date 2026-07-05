import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import Link from "next/link";
import Nav from "../components/Nav";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const STATUS_META = {
  queued:  { color: "#64748b", bg: "#1e2d4a",   label: "Queued",   icon: "⏳" },
  running: { color: "#60a5fa", bg: "#1a56db22", label: "Running",  icon: "⚡" },
  done:    { color: "#22c55e", bg: "#16a34a22", label: "Done",     icon: "✅" },
  failed:  { color: "#ef4444", bg: "#dc262622", label: "Failed",   icon: "❌" },
  skipped: { color: "#94a3b8", bg: "#1e2d4a",   label: "Skipped",  icon: "⏭️" },
};

const EVENT_LABELS = {
  salary_hike: "Salary Hike 📈", city_relocation: "Relocation 🏙️",
  new_emi_detected: "New EMI 🏠", insurance_gap: "Insurance Gap 🛡️",
  marriage_detected: "Marriage 💍", new_baby_detected: "New Baby 👶",
  no_event: "No Event",
};

export default function BatchPage() {
  const [batchRuns, setBatchRuns] = useState([]);
  const [activeRun, setActiveRun] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [concurrency, setConcurrency] = useState(3);
  const [customers, setCustomers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const sseRef = useRef(null);

  useEffect(() => {
    fetch(`${API}/api/customers`)
      .then(r => r.json())
      .then(cs => { setCustomers(cs); setSelectedIds(cs.map(c => c.id)); })
      .catch(console.error);

    fetch(`${API}/api/batch`)
      .then(r => r.json())
      .then(d => setBatchRuns(d.runs || []))
      .catch(console.error);
  }, []);

  const startBatch = async () => {
    if (isRunning) return;
    setIsRunning(true);

    const res = await fetch(`${API}/api/batch/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer_ids: selectedIds, concurrency }),
    });
    const data = await res.json();
    const runId = data.run_id;

    // Open SSE stream
    if (sseRef.current) sseRef.current.close();
    const es = new EventSource(`${API}/api/batch/${runId}/stream`);
    sseRef.current = es;

    es.onmessage = (e) => {
      const run = JSON.parse(e.data);
      setActiveRun(run);
      if (run.is_complete) {
        es.close();
        setIsRunning(false);
        setBatchRuns(prev => [run, ...prev.filter(r => r.run_id !== run.run_id)]);
      }
    };
    es.onerror = () => { es.close(); setIsRunning(false); };
  };

  const toggleCustomer = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const run = activeRun;
  const progressPct = run?.progress_pct || 0;
  const jobs = run?.jobs || [];

  return (
    <>
      <Head><title>SBI LifePulse — Batch Processing</title></Head>
      <div style={{ minHeight: "100vh", background: "#0a0f1e", fontFamily: "'Inter', sans-serif", color: "#e2e8f0" }}>

        {/* Nav */}
        <nav style={{ background: "#0d1629", borderBottom: "1px solid #1e2d4a", padding: "0 1.5rem", height: 54, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18 }}>⚡</span>
            <span style={{ fontWeight: 700, color: "#fff" }}>SBI LifePulse</span>
            <span style={{ fontSize: 11, color: "#64748b" }}>/ Batch Engine</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Link href="/" style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #1e2d4a", background: "transparent", color: "#94a3b8", fontSize: 12, textDecoration: "none" }}>← Dashboard</Link>
            <Link href="/analytics" style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: "#1e2d4a", color: "#94a3b8", fontSize: 12, textDecoration: "none" }}>📊 Analytics</Link>
          </div>
        </nav>

        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", height: "calc(100vh - 54px)" }}>

          {/* Sidebar: config */}
          <div style={{ background: "#0d1629", borderRight: "1px solid #1e2d4a", padding: "1.25rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "1rem" }}>

            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Batch Configuration</div>

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>Concurrency (parallel agents)</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {[1, 2, 3, 5, 6].map(n => (
                    <button key={n} onClick={() => setConcurrency(n)}
                      style={{ flex: 1, padding: "6px 0", borderRadius: 6, border: `1px solid ${concurrency === n ? "#1a56db" : "#1e2d4a"}`, background: concurrency === n ? "#1a56db22" : "transparent", color: concurrency === n ? "#60a5fa" : "#64748b", fontSize: 13, fontWeight: concurrency === n ? 600 : 400, cursor: "pointer" }}>
                      {n}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: "#334155", marginTop: 5 }}>
                  {concurrency === 1 ? "Sequential — safest" : concurrency <= 3 ? "Balanced — recommended" : "Aggressive — fastest"}
                </div>
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 12, color: "#64748b" }}>Select customers ({selectedIds.length}/{customers.length})</div>
                <button onClick={() => setSelectedIds(selectedIds.length === customers.length ? [] : customers.map(c => c.id))}
                  style={{ fontSize: 11, color: "#60a5fa", background: "none", border: "none", cursor: "pointer" }}>
                  {selectedIds.length === customers.length ? "Deselect all" : "Select all"}
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {customers.map(c => (
                  <label key={c.id} style={{ display: "flex", gap: 8, alignItems: "center", padding: "7px 10px", background: selectedIds.includes(c.id) ? "#1a56db11" : "#0a0f1e", border: `1px solid ${selectedIds.includes(c.id) ? "#1a56db44" : "#1e2d4a"}`, borderRadius: 8, cursor: "pointer" }}>
                    <input type="checkbox" checked={selectedIds.includes(c.id)} onChange={() => toggleCustomer(c.id)} style={{ accentColor: "#1a56db" }} />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: "#e2e8f0" }}>{c.name}</div>
                      <div style={{ fontSize: 10, color: "#475569" }}>{c.city}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={startBatch}
              disabled={isRunning || selectedIds.length === 0}
              style={{ padding: "10px", borderRadius: 8, border: "none", background: isRunning || selectedIds.length === 0 ? "#1e2d4a" : "linear-gradient(135deg, #1a56db, #0ea5e9)", color: isRunning || selectedIds.length === 0 ? "#475569" : "#fff", fontSize: 13, fontWeight: 700, cursor: isRunning || selectedIds.length === 0 ? "default" : "pointer", marginTop: "auto" }}>
              {isRunning ? `⚡ Processing ${run?.done || 0}/${run?.total || selectedIds.length}...` : `🚀 Run Batch (${selectedIds.length} customers)`}
            </button>
          </div>

          {/* Main: active run */}
          <div style={{ overflowY: "auto", padding: "1.5rem" }}>

            {!run ? (
              <div style={{ textAlign: "center", marginTop: "6rem", color: "#334155" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>⚡</div>
                <div style={{ fontSize: 16, color: "#475569", marginBottom: 6 }}>No batch run active</div>
                <div style={{ fontSize: 13 }}>Select customers and click Run Batch to process them in parallel</div>
                <div style={{ fontSize: 12, marginTop: 8, color: "#1e2d4a" }}>
                  In production: this runs nightly on all {(500000000).toLocaleString("en-IN")} SBI customers
                </div>
              </div>
            ) : (
              <>
                {/* Run header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 18, color: "#f1f5f9" }}>{run.run_id}</div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                      {run.concurrency} concurrent agents · {run.elapsed_seconds}s elapsed
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <StatChip label="Total" value={run.total} color="#60a5fa" />
                    <StatChip label="Done" value={run.successful} color="#22c55e" />
                    <StatChip label="Failed" value={run.failed} color="#ef4444" />
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ marginBottom: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: "#94a3b8" }}>Progress</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: run.is_complete ? "#22c55e" : "#60a5fa" }}>{progressPct}%</span>
                  </div>
                  <div style={{ height: 10, background: "#1e2d4a", borderRadius: 5, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${progressPct}%`, background: run.is_complete ? "#22c55e" : "linear-gradient(90deg, #1a56db, #0ea5e9)", borderRadius: 5, transition: "width 0.4s ease" }} />
                  </div>
                  {run.is_complete && (
                    <div style={{ marginTop: 8, fontSize: 13, color: "#22c55e", fontWeight: 600 }}>
                      ✅ Batch complete — {run.successful} customers processed in {run.elapsed_seconds}s
                    </div>
                  )}
                </div>

                {/* Job cards grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "0.75rem" }}>
                  {jobs.map((job) => {
                    const sm = STATUS_META[job.status] || STATUS_META.queued;
                    const event = job.result?.event || "";
                    return (
                      <div key={job.customer_id} style={{ background: "#0d1629", border: `1px solid ${sm.color}44`, borderRadius: 10, padding: "0.9rem 1rem", position: "relative", overflow: "hidden" }}>
                        {/* Running pulse */}
                        {job.status === "running" && (
                          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, #1a56db11, transparent)", animation: "shimmer 1.5s infinite", backgroundSize: "200% 100%" }} />
                        )}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: "#f1f5f9" }}>{job.customer_name}</div>
                          <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 99, background: sm.bg, color: sm.color, fontWeight: 500, whiteSpace: "nowrap" }}>
                            {sm.icon} {sm.label}
                          </span>
                        </div>
                        {job.status === "done" && event && (
                          <div style={{ fontSize: 11, color: "#93c5fd", marginBottom: 3 }}>
                            {EVENT_LABELS[event] || event}
                          </div>
                        )}
                        {job.result?.product && (
                          <div style={{ fontSize: 11, color: "#64748b" }}>{job.result.product}</div>
                        )}
                        {job.status === "done" && job.result?.confidence && (
                          <div style={{ fontSize: 11, color: "#22c55e", marginTop: 3 }}>
                            {Math.round(job.result.confidence * 100)}% confidence
                          </div>
                        )}
                        {job.status === "failed" && (
                          <div style={{ fontSize: 11, color: "#ef4444", marginTop: 3 }}>{job.error?.slice(0, 60)}</div>
                        )}
                        {job.duration_ms > 0 && (
                          <div style={{ fontSize: 10, color: "#334155", marginTop: 4 }}>{job.duration_ms}ms</div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Scale projection */}
                {run.is_complete && (
                  <div style={{ marginTop: "1.5rem", background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 12, padding: "1.25rem" }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "#f1f5f9", marginBottom: "1rem" }}>📐 If this ran on all 50 crore SBI customers...</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
                      {[
                        { label: "Customers Processed", value: "50 Crore", color: "#60a5fa" },
                        { label: "Events Detected (est)", value: "7.5 Crore", color: "#a78bfa" },
                        { label: "Enrolled (est)", value: "60 Lakh", color: "#22c55e" },
                        { label: "Revenue Uplift (est)", value: "₹2,520 Cr/yr", color: "#f59e0b" },
                      ].map(item => (
                        <div key={item.label} style={{ background: "#0a0f1e", borderRadius: 8, padding: "0.75rem 1rem" }}>
                          <div style={{ fontSize: 18, fontWeight: 700, color: item.color }}>{item.value}</div>
                          <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{item.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Previous runs */}
            {batchRuns.filter(r => r.run_id !== run?.run_id).length > 0 && (
              <div style={{ marginTop: "1.5rem" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.75rem" }}>Previous Runs</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {batchRuns.filter(r => r.run_id !== run?.run_id).map(r => (
                    <div key={r.run_id} style={{ background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 8, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={() => setActiveRun(r)}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: "#e2e8f0" }}>{r.run_id}</div>
                        <div style={{ fontSize: 11, color: "#475569" }}>{r.total} customers · {r.elapsed_seconds}s</div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <span style={{ fontSize: 12, color: "#22c55e" }}>{r.successful} done</span>
                        {r.failed > 0 && <span style={{ fontSize: 12, color: "#ef4444" }}>{r.failed} failed</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
      `}</style>
    </>
  );
}

function StatChip({ label, value, color }) {
  return (
    <div style={{ background: "#0a0f1e", border: "1px solid #1e2d4a", borderRadius: 8, padding: "5px 12px", textAlign: "center" }}>
      <div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 10, color: "#475569" }}>{label}</div>
    </div>
  );
}
