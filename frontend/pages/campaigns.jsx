import { useState, useEffect } from "react";
import Head from "next/head";
import Nav from "../components/Nav";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const STATUS_META = {
  scheduled: { color: "#60a5fa", bg: "#3b82f622", label: "Scheduled" },
  running:   { color: "#22c55e", bg: "#16a34a22", label: "🟢 Running" },
  completed: { color: "#a78bfa", bg: "#7c3aed22", label: "Completed" },
  paused:    { color: "#f59e0b", bg: "#f59e0b22", label: "Paused" },
};

const EVENT_COLOR = {
  salary_hike: "#22c55e", city_relocation: "#3b82f6",
  new_emi_detected: "#f59e0b", insurance_gap: "#ef4444",
  marriage_detected: "#a855f7", new_baby_detected: "#ec4899",
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("campaigns");

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/campaigns`).then(r => r.json()),
      fetch(`${API}/api/campaigns/schedule`).then(r => r.json()),
    ]).then(([c, s]) => {
      setCampaigns(c.campaigns || []);
      setSchedule(s);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <>
      <Head><title>SBI LifePulse — Campaigns</title></Head>
      <div style={{ minHeight: "100vh", background: "#0a0f1e", fontFamily: "'Inter',sans-serif", color: "#e2e8f0" }}>
        <Nav subtitle="CAMPAIGN SCHEDULER" />

        <div style={{ padding: "1.5rem 2rem", maxWidth: 1100, margin: "0 auto" }}>

          <div style={{ marginBottom: "1.5rem" }}>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", margin: 0 }}>Campaign Scheduler</h1>
            <p style={{ color: "#475569", fontSize: 13, margin: "4px 0 0" }}>
              How LifePulse runs in production — cron-driven, fully automated, SLA-bound
            </p>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, marginBottom: "1.5rem" }}>
            {[
              { id: "campaigns", label: "Active Campaigns" },
              { id: "schedule",  label: "Production Schedule" },
              { id: "sla",       label: "SLAs & Guarantees" },
            ].map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                style={{ padding: "7px 16px", borderRadius: 7, border: "none", background: activeTab === t.id ? "#1a56db" : "#1e2d4a", color: activeTab === t.id ? "#fff" : "#64748b", fontSize: 12, fontWeight: activeTab === t.id ? 600 : 400, cursor: "pointer" }}>
                {t.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ color: "#475569", textAlign: "center", padding: "3rem" }}>Loading campaigns...</div>
          ) : (
            <>
              {/* Campaigns tab */}
              {activeTab === "campaigns" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {campaigns.map(c => {
                    const sm = STATUS_META[c.status] || STATUS_META.scheduled;
                    return (
                      <div key={c.campaign_id} style={{ background: "#0d1629", border: `1px solid ${sm.color}33`, borderRadius: 12, padding: "1.25rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                          <div>
                            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 4 }}>
                              <span style={{ fontSize: 11, color: "#475569", fontFamily: "monospace", background: "#0a0f1e", padding: "1px 6px", borderRadius: 4 }}>{c.campaign_id}</span>
                              <span style={{ fontSize: 12, fontWeight: 600, padding: "2px 8px", borderRadius: 99, background: sm.bg, color: sm.color }}>{sm.label}</span>
                            </div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9" }}>{c.name}</div>
                            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{c.description}</div>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <div style={{ fontSize: 11, color: "#475569" }}>Cron</div>
                            <div style={{ fontSize: 12, fontFamily: "monospace", color: "#93c5fd" }}>{c.schedule_cron}</div>
                            <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>Next run</div>
                            <div style={{ fontSize: 11, color: "#f1f5f9" }}>{c.next_run_description}</div>
                          </div>
                        </div>

                        {/* Target events */}
                        {c.target_events?.length > 0 && (
                          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
                            {c.target_events.map(evt => (
                              <span key={evt} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 99, background: (EVENT_COLOR[evt] || "#64748b") + "22", color: EVENT_COLOR[evt] || "#64748b" }}>
                                {evt.replace(/_/g, " ")}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Stats */}
                        {Object.keys(c.stats).length > 0 && (
                          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", padding: "8px 12px", background: "#0a0f1e", borderRadius: 8 }}>
                            {Object.entries(c.stats).map(([k, v]) => (
                              <div key={k}>
                                <div style={{ fontSize: 10, color: "#475569", textTransform: "capitalize" }}>{k.replace(/_/g, " ")}</div>
                                <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0" }}>
                                  {typeof v === "number" ? v.toLocaleString() : v}
                                </div>
                              </div>
                            ))}
                            {c.estimated_reach > 0 && (
                              <div>
                                <div style={{ fontSize: 10, color: "#475569" }}>Estimated reach</div>
                                <div style={{ fontSize: 12, fontWeight: 600, color: "#60a5fa" }}>{(c.estimated_reach / 1000000).toFixed(1)}M customers</div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Schedule tab */}
              {activeTab === "schedule" && schedule && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  {["daily_schedule", "weekly_schedule", "monthly_schedule"].map(period => (
                    <div key={period} style={{ background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 12, padding: "1.25rem" }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "#f1f5f9", marginBottom: "1rem", textTransform: "capitalize" }}>
                        {period.replace(/_/g, " ")}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {schedule[period]?.map((item, i) => (
                          <div key={i} style={{ display: "flex", gap: 14, alignItems: "center", padding: "8px 12px", background: "#0a0f1e", borderRadius: 8 }}>
                            <div style={{ minWidth: 120, fontSize: 12, fontWeight: 600, color: "#60a5fa", fontFamily: "monospace" }}>
                              {item.time || item.day}
                            </div>
                            <div style={{ flex: 1, fontSize: 12, color: "#94a3b8" }}>{item.job}</div>
                            {item.customers && <div style={{ fontSize: 11, color: "#475569", flexShrink: 0 }}>{item.customers}</div>}
                            {item.duration && <div style={{ fontSize: 11, color: "#22c55e", flexShrink: 0 }}>{item.duration}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div style={{ background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 12, padding: "1.25rem" }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "#f1f5f9", marginBottom: "1rem" }}>Infrastructure</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {[
                        { label: "Timezone", value: schedule.timezone },
                        { label: "Orchestration", value: schedule.infrastructure },
                      ].map(item => (
                        <div key={item.label} style={{ background: "#0a0f1e", borderRadius: 8, padding: "8px 12px" }}>
                          <div style={{ fontSize: 10, color: "#475569" }}>{item.label}</div>
                          <div style={{ fontSize: 12, color: "#e2e8f0", marginTop: 2 }}>{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SLA tab */}
              {activeTab === "sla" && schedule?.sla && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "1rem" }}>
                  {Object.entries(schedule.sla).map(([key, value]) => (
                    <div key={key} style={{ background: "#0d1629", border: "1px solid #22c55e33", borderRadius: 12, padding: "1.25rem" }}>
                      <div style={{ fontSize: 11, color: "#64748b", textTransform: "capitalize", marginBottom: 6 }}>
                        {key.replace(/_/g, " ")}
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: "#22c55e" }}>{value}</div>
                      <div style={{ width: 24, height: 2, background: "#22c55e", borderRadius: 1, marginTop: 8 }} />
                    </div>
                  ))}

                  <div style={{ background: "#0d1629", border: "1px solid #1a56db33", borderRadius: 12, padding: "1.25rem", gridColumn: "1 / -1" }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "#f1f5f9", marginBottom: "1rem" }}>Integration Path with SBI Systems</div>
                    <div style={{ display: "flex", gap: 0, overflowX: "auto" }}>
                      {[
                        { step: "SBI Finacle", sub: "Core banking\ntransaction API", color: "#1a56db" },
                        { step: "Kafka Stream", sub: "Real-time\ntransaction feed", color: "#3b82f6" },
                        { step: "LifePulse", sub: "5-agent\nAI pipeline", color: "#a855f7" },
                        { step: "WhatsApp\nBusiness API", sub: "Meta verified\nbusiness account", color: "#25d366" },
                        { step: "YONO App", sub: "In-app push\nnotification", color: "#f59e0b" },
                        { step: "Audit Log", sub: "S3 + RBI\ncompliance report", color: "#64748b" },
                      ].map((item, i, arr) => (
                        <div key={item.step} style={{ display: "flex", alignItems: "center" }}>
                          <div style={{ padding: "10px 14px", background: item.color + "22", border: `1px solid ${item.color}44`, borderRadius: 8, textAlign: "center", minWidth: 100 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: item.color, whiteSpace: "pre-line" }}>{item.step}</div>
                            <div style={{ fontSize: 10, color: "#475569", marginTop: 4, whiteSpace: "pre-line" }}>{item.sub}</div>
                          </div>
                          {i < arr.length - 1 && (
                            <div style={{ padding: "0 6px", color: "#334155", fontSize: 14, flexShrink: 0 }}>→</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
