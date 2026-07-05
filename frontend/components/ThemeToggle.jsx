import { useState, useEffect } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("lifepulse_theme");
    if (saved === "light") {
      setDark(false);
      document.documentElement.setAttribute("data-theme", "light");
    }
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("lifepulse_theme", next ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");

    // Inject light theme CSS vars dynamically
    const existing = document.getElementById("theme-override");
    if (existing) existing.remove();

    if (!next) {
      const style = document.createElement("style");
      style.id = "theme-override";
      style.textContent = `
        body { background: #f8fafc !important; color: #0f172a !important; }
        nav { background: #fff !important; border-bottom-color: #e2e8f0 !important; }
        nav a, nav button { color: #475569 !important; }
        [style*="background: #0a0f1e"] { background: #f8fafc !important; }
        [style*="background: #0d1629"] { background: #fff !important; border-color: #e2e8f0 !important; }
        [style*="background: #1e2d4a"] { background: #e2e8f0 !important; }
        [style*="color: #e2e8f0"], [style*="color: #f1f5f9"], [style*="color: #94a3b8"] { color: #334155 !important; }
        [style*="color: #64748b"], [style*="color: #475569"] { color: #475569 !important; }
        [style*="border-color: #1e2d4a"] { border-color: #e2e8f0 !important; }
        [style*="color: #334155"] { color: #94a3b8 !important; }
      `;
      document.head.appendChild(style);
    } else {
      // Remove light theme overrides
      const s = document.getElementById("theme-override");
      if (s) s.remove();
    }
  };

  return (
    <button onClick={toggle}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      style={{ background: "none", border: "1px solid #1e2d4a", borderRadius: 6, cursor: "pointer", padding: "4px 8px", fontSize: 14, color: "#64748b", display: "flex", alignItems: "center", gap: 4 }}>
      {dark ? "☀️" : "🌙"}
    </button>
  );
}
