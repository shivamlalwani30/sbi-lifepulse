import Link from "next/link";
import dynamic from "next/dynamic";
const NotificationBell = dynamic(() => import("./NotificationBell"), { ssr: false });
const ThemeToggle = dynamic(() => import("./ThemeToggle"), { ssr: false });
import { useRouter } from "next/router";

const PRIMARY = [
  { href: "/",             label: "Dashboard",   icon: "🏠" },
  { href: "/demo",         label: "Demo",        icon: "▶", highlight: true },
  { href: "/yono",         label: "YONO",        icon: "📱" },
  { href: "/simulate",     label: "Live Sim",    icon: "",  pulse: true },
  { href: "/multilingual", label: "Languages",   icon: "🌐" },
];

const ANALYSIS = [
  { href: "/analytics",    label: "Analytics",   icon: "📊" },
  { href: "/feedback",     label: "Feedback",    icon: "🧠" },
  { href: "/risk",         label: "Risk",        icon: "🛡️" },
  { href: "/business",     label: "Business",    icon: "💼" },
  { href: "/eligibility",  label: "Eligibility", icon: "✔️" },
];

const OPERATIONS = [
  { href: "/batch",       label: "Batch",      icon: "⚡" },
  { href: "/webhook",     label: "Webhook",    icon: "📡" },
  { href: "/campaigns",   label: "Campaigns",  icon: "📅" },
  { href: "/fraud",       label: "Fraud Gate", icon: "🔒" },
  { href: "/twilio",      label: "WhatsApp",   icon: "📲" },
];

const KNOWLEDGE = [
  { href: "/scale",       label: "Scale",       icon: "📐" },
  { href: "/agents",      label: "Agents",      icon: "🔬" },
  { href: "/performance", label: "Performance", icon: "⏱️" },
  { href: "/deeplink",    label: "Deeplinks",   icon: "🔗" },
  { href: "/qr",          label: "QR Code",     icon: "📲" },
  { href: "/pitch",       label: "Pitch Kit",   icon: "🎯" },
  { href: "/preflight",   label: "Pre-Flight",  icon: "✅" },
];

const ALL_ITEMS = [...PRIMARY, ...ANALYSIS, ...OPERATIONS, ...KNOWLEDGE];

export default function Nav({ subtitle = "" }) {
  const router = useRouter();
  const current = router.pathname;

  return (
    <nav style={{
      background: "#0d1629",
      borderBottom: "1px solid #1e2d4a",
      padding: "0 0.75rem",
      height: 46,
      display: "flex",
      alignItems: "center",
      gap: 4,
      position: "sticky",
      top: 0,
      zIndex: 200,
    }}>
      {/* Logo */}
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none", flexShrink: 0, marginRight: 6 }}>
        <div style={{ width: 24, height: 24, background: "linear-gradient(135deg,#1a56db,#0ea5e9)", borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>⚡</div>
        <div style={{ fontWeight: 700, fontSize: 12, color: "#fff" }}>LifePulse</div>
      </Link>

      <div style={{ width: 1, height: 18, background: "#1e2d4a", flexShrink: 0 }} />

      {/* Scrollable nav links */}
      <div style={{ display: "flex", gap: 1, overflowX: "auto", flex: 1 }}>
        {ALL_ITEMS.map(item => {
          const isActive = current === item.href || (item.href !== "/" && current.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} style={{
              padding: "4px 8px",
              borderRadius: 5,
              background: item.highlight ? "linear-gradient(135deg,#1a56db,#0ea5e9)" : isActive ? "#1e2d4a" : "transparent",
              color: item.highlight ? "#fff" : isActive ? "#f1f5f9" : "#64748b",
              fontSize: 11,
              fontWeight: item.highlight || isActive ? 600 : 400,
              textDecoration: "none",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: 3,
              flexShrink: 0,
              transition: "background 0.15s, color 0.15s",
            }}>
              {item.pulse ? (
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#ef4444", display: "inline-block", animation: "lp 1.5s ease-in-out infinite" }} />
                  {item.label}
                </span>
              ) : (
                <>{item.icon && <span style={{ fontSize: 10 }}>{item.icon}</span>}{item.label}</>
              )}
            </Link>
          );
        })}
      </div>

      <style>{`
        @keyframes lp{0%,100%{opacity:1}50%{opacity:0.3}}
        nav::-webkit-scrollbar{display:none}
        nav *::-webkit-scrollbar{display:none}
      `}</style>
    </nav>
  );
}
