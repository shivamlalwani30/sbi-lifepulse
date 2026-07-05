import Link from "next/link";

const EVENT_META = {
  salary_hike:       { label: "Salary Hike",    color: "#22c55e", emoji: "📈" },
  city_relocation:   { label: "Relocation",     color: "#3b82f6", emoji: "🏙️" },
  new_emi_detected:  { label: "New EMI",        color: "#f59e0b", emoji: "🏠" },
  insurance_gap:     { label: "Insurance Gap",  color: "#ef4444", emoji: "🛡️" },
  marriage_detected: { label: "Marriage",       color: "#a855f7", emoji: "💍" },
  new_baby_detected: { label: "New Baby",       color: "#ec4899", emoji: "👶" },
  no_event:          { label: "Monitoring",     color: "#64748b", emoji: "👁️" },
};

const STATUS_META = {
  pending:   { color: "#f59e0b", label: "Sent · Awaiting Reply" },
  enrolled:  { color: "#22c55e", label: "✅ Enrolled" },
  opted_out: { color: "#ef4444", label: "Opted Out" },
};

export default function CustomerCard({ customer, session, isRunning, onRunPipeline, onOpenChat }) {
  const balances = customer.account_balance_history || [];
  const latest = balances[balances.length - 1]?.balance || 0;
  const first = balances[0]?.balance || 0;
  const trendUp = latest > first;
  const trendColor = trendUp ? "#22c55e" : latest < first ? "#ef4444" : "#94a3b8";
  const maxBar = Math.max(...balances.map(b => b.balance), 1);

  const evMeta = EVENT_META[session?.event] || null;
  const statusMeta = STATUS_META[session?.enrollment_status] || null;

  return (
    <div style={{ background: "#0d1629", border: `1px solid ${isRunning ? "#1a56db" : "#1e2d4a"}`, borderRadius: 12, padding: "1.1rem 1.25rem", display: "flex", flexDirection: "column", gap: 10, boxShadow: isRunning ? "0 0 0 1px #1a56db33" : "none", transition: "border-color 0.2s, box-shadow 0.2s" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Link href={`/customer/${customer.id}`} style={{ display: "flex", gap: 10, alignItems: "center", textDecoration: "none" }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#1a56db22,#0ea5e922)", border: "1px solid #1e2d4a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: "#60a5fa", flexShrink: 0 }}>
            {customer.name.charAt(0)}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: "#f1f5f9" }}>{customer.name}</div>
            <div style={{ fontSize: 11, color: "#475569" }}>{customer.city} · {customer.profile?.occupation}</div>
          </div>
        </Link>
        {evMeta && (
          <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 99, background: evMeta.color + "22", color: evMeta.color, whiteSpace: "nowrap", flexShrink: 0 }}>
            {evMeta.emoji} {evMeta.label}
          </span>
        )}
      </div>

      {/* Sparkline */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
          <span style={{ fontSize: 11, color: "#475569" }}>Balance trend</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: trendColor }}>
            {trendUp ? "↑" : latest < first ? "↓" : "→"} ₹{(latest/1000).toFixed(0)}K
          </span>
        </div>
        <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 28 }}>
          {balances.map((b, i) => (
            <div key={i} title={`${b.month}: ₹${b.balance.toLocaleString()}`} style={{ flex: 1, background: i === balances.length - 1 ? trendColor : "#1e2d4a", borderRadius: 3, height: `${Math.max(Math.round((b.balance/maxBar)*100),8)}%`, minHeight: 4, transition: "background 0.3s" }} />
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
          {balances.map((b, i) => <span key={i} style={{ fontSize: 9, color: "#334155" }}>{b.month?.slice(2)}</span>)}
        </div>
      </div>

      {/* Product card */}
      {session?.product && (
        <div style={{ background: "#0a0f1e", border: "1px solid #1e2d4a", borderRadius: 8, padding: "7px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 10, color: "#475569", marginBottom: 2 }}>Recommended</div>
            <div style={{ fontSize: 12, fontWeight: 500, color: "#93c5fd" }}>{session.product}</div>
          </div>
          {session.confidence && (
            <div style={{ fontSize: 13, fontWeight: 700, color: "#22c55e" }}>{Math.round(session.confidence * 100)}%</div>
          )}
        </div>
      )}

      {/* Status */}
      {statusMeta && <div style={{ fontSize: 11, fontWeight: 600, color: statusMeta.color }}>{statusMeta.label}</div>}

      {/* Existing products */}
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {(customer.profile?.existing_products || []).map((p, i) => (
          <span key={i} style={{ fontSize: 10, background: "#0a0f1e", color: "#475569", padding: "2px 6px", borderRadius: 4, border: "1px solid #1e2d4a" }}>{p}</span>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 6 }}>
        <button onClick={onRunPipeline} disabled={isRunning}
          style={{ flex: 1, padding: "7px 10px", borderRadius: 7, border: `1px solid ${isRunning ? "#1a56db" : "#1e2d4a"}`, background: isRunning ? "#1a56db11" : "transparent", color: isRunning ? "#60a5fa" : "#94a3b8", fontSize: 12, fontWeight: 500, cursor: isRunning ? "default" : "pointer", transition: "all 0.2s" }}>
          {isRunning ? "⚡ Running..." : "▶ Run Pipeline"}
        </button>
        {session?.whatsapp_message && (
          <button onClick={onOpenChat}
            style={{ flex: 1, padding: "7px 10px", borderRadius: 7, border: "none", background: "#25d366", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            💬 Chat
          </button>
        )}
        <Link href={`/customer/${customer.id}`}
          style={{ padding: "7px 10px", borderRadius: 7, border: "1px solid #1e2d4a", background: "transparent", color: "#64748b", fontSize: 12, textDecoration: "none", display: "flex", alignItems: "center" }}
          title="Customer 360">
          360°
        </Link>
      </div>
    </div>
  );
}
