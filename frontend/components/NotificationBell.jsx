import { useState, useEffect, useRef } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const timerRef = useRef(null);
  const prevCountRef = useRef(0);

  // Poll analytics every 8 seconds for new enrollments/events
  useEffect(() => {
    const poll = async () => {
      try {
        const r = await fetch(`${API}/api/analytics`);
        const d = await r.json();
        const enrolled = d.overview?.enrolled || 0;
        const detected = d.overview?.events_detected || 0;

        if (enrolled > prevCountRef.current) {
          const diff = enrolled - prevCountRef.current;
          const newNotif = {
            id: Date.now(),
            type: "enrolled",
            icon: "✅",
            title: `${diff} new enrollment${diff > 1 ? "s" : ""}`,
            body: `Product enrollment completed via WhatsApp`,
            ts: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            color: "#22c55e",
          };
          setNotifications(prev => [newNotif, ...prev.slice(0, 19)]);
          setUnread(n => n + 1);
          prevCountRef.current = enrolled;
        }
      } catch { /* silent */ }
    };

    timerRef.current = setInterval(poll, 8000);
    poll(); // run immediately
    return () => clearInterval(timerRef.current);
  }, []);

  const addDemo = () => {
    const demos = [
      { type: "pipeline", icon: "⚡", title: "Pipeline complete", body: "Priya Sharma — salary_hike detected (95%)", color: "#60a5fa" },
      { type: "enrolled", icon: "✅", title: "SIP enrolled!", body: "Deepak Nair enrolled in SBI Child Plan", color: "#22c55e" },
      { type: "fraud",    icon: "🔒", title: "Fraud gate triggered", body: "1 account flagged for review", color: "#ef4444" },
      { type: "opted_out",icon: "🚫", title: "Customer opted out", body: "Rahul Verma sent STOP — consent withdrawn", color: "#f59e0b" },
    ];
    const notif = { ...demos[Math.floor(Math.random() * demos.length)], id: Date.now(), ts: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
    setNotifications(prev => [notif, ...prev.slice(0, 19)]);
    setUnread(n => n + 1);
  };

  const clear = () => { setNotifications([]); setUnread(0); setOpen(false); };
  const openPanel = () => { setOpen(o => !o); setUnread(0); };

  return (
    <div style={{ position: "relative" }}>
      {/* Bell button */}
      <button onClick={openPanel}
        style={{ position: "relative", background: "none", border: "none", cursor: "pointer", padding: "4px 8px", borderRadius: 6, display: "flex", alignItems: "center", color: "#64748b" }}>
        <span style={{ fontSize: 16 }}>🔔</span>
        {unread > 0 && (
          <span style={{ position: "absolute", top: 0, right: 2, width: 16, height: 16, borderRadius: "50%", background: "#ef4444", color: "#fff", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 998 }} />
          <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", width: 320, background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 12, boxShadow: "0 20px 40px #00000066", zIndex: 999, overflow: "hidden" }}>
            <div style={{ padding: "10px 14px", borderBottom: "1px solid #1e2d4a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: "#f1f5f9" }}>Notifications</div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={addDemo} style={{ fontSize: 10, color: "#60a5fa", background: "none", border: "none", cursor: "pointer" }}>+ Demo</button>
                <button onClick={clear} style={{ fontSize: 10, color: "#64748b", background: "none", border: "none", cursor: "pointer" }}>Clear</button>
              </div>
            </div>
            <div style={{ maxHeight: 360, overflowY: "auto" }}>
              {notifications.length === 0 ? (
                <div style={{ textAlign: "center", padding: "2rem", color: "#334155", fontSize: 12 }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>🔔</div>
                  No notifications yet.<br />Run a pipeline to see alerts here.
                </div>
              ) : notifications.map(n => (
                <div key={n.id} style={{ padding: "10px 14px", borderBottom: "1px solid #0a0f1e", display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: n.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{n.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#f1f5f9" }}>{n.title}</div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{n.body}</div>
                  </div>
                  <div style={{ fontSize: 10, color: "#334155", flexShrink: 0 }}>{n.ts}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
