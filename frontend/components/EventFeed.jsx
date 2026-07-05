import { useEffect, useRef } from "react";

const EVENT_ICONS = {
  status: "⏳",
  behavior: "📊",
  detection: "🎯",
  outreach: "📲",
  complete: "✅",
  error: "❌",
};

const EVENT_COLORS = {
  status: "#64748b",
  behavior: "#3b82f6",
  detection: "#a855f7",
  outreach: "#f59e0b",
  complete: "#22c55e",
  error: "#ef4444",
};

export default function EventFeed({ events, selectedCustomer }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #1e2d4a" }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: "#f1f5f9" }}>Agent Event Feed</div>
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
          {selectedCustomer ? `Watching: ${selectedCustomer.name}` : "Select a customer to run pipeline"}
        </div>
      </div>

      {/* Events */}
      <div style={{ flex: 1, overflowY: "auto", padding: "1rem" }}>
        {events.length === 0 ? (
          <div style={{ textAlign: "center", color: "#334155", fontSize: 13, marginTop: "3rem" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>⚡</div>
            <div>Events will stream here</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Click "Run Pipeline" on any customer</div>
          </div>
        ) : (
          events.map((ev, i) => (
            <div key={i} style={{ marginBottom: "0.75rem", padding: "10px 12px", background: "#0a0f1e", border: `1px solid ${EVENT_COLORS[ev.type] || "#1e2d4a"}22`, borderLeft: `3px solid ${EVENT_COLORS[ev.type] || "#1e2d4a"}`, borderRadius: 8, animation: "fadeIn 0.3s ease" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{EVENT_ICONS[ev.type] || "•"}</span>
                  <div>
                    <div style={{ fontSize: 13, color: "#e2e8f0", lineHeight: 1.4 }}>{ev.payload?.message}</div>
                    {ev.payload?.confidence && (
                      <div style={{ fontSize: 11, color: "#22c55e", marginTop: 3 }}>
                        Confidence: {Math.round(ev.payload.confidence * 100)}%
                      </div>
                    )}
                    {ev.payload?.recommended_product && (
                      <div style={{ fontSize: 11, color: "#93c5fd", marginTop: 2 }}>
                        → {ev.payload.recommended_product}
                      </div>
                    )}
                    {ev.payload?.salary_trend !== undefined && (
                      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                        Salary trend: {ev.payload.salary_trend > 0 ? "+" : ""}{ev.payload.salary_trend?.toFixed(1)}%
                        {ev.payload.location_change && " · Relocation detected"}
                        {ev.payload.emi_detected && " · New EMI found"}
                      </div>
                    )}
                  </div>
                </div>
                <span style={{ fontSize: 10, color: "#475569", whiteSpace: "nowrap", flexShrink: 0 }}>{ev.ts}</span>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Footer stats */}
      <div style={{ borderTop: "1px solid #1e2d4a", padding: "0.75rem 1.25rem" }}>
        <div style={{ fontSize: 11, color: "#475569" }}>
          {events.length} events · {events.filter(e => e.type === "complete").length} completed
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
