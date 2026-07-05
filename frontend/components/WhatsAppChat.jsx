import { useState, useEffect, useRef } from "react";
import TranscriptExporter from "./TranscriptExporter";

export default function WhatsAppChat({ customer, session, onBack, onEnrollmentUpdate, api }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [enrollmentStatus, setEnrollmentStatus] = useState(session.enrollment_status || "pending");
  const [conversationHistory, setConversationHistory] = useState([]);
  const [lastIntent, setLastIntent] = useState(null);
  const [lastSentiment, setLastSentiment] = useState(null);
  const [convSentiment, setConvSentiment] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Seed the opening message from the agent
  useEffect(() => {
    if (session?.whatsapp_message) {
      setMessages([
        {
          id: 1,
          from: "agent",
          text: session.whatsapp_message,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          status: "read",
        },
      ]);
      setConversationHistory([
        { role: "assistant", content: session.whatsapp_message }
      ]);
    }
  }, [session]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isTyping) return;

    const userMsg = {
      id: Date.now(),
      from: "user",
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "sent",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);
    inputRef.current?.focus();

    try {
      const res = await fetch(`${api}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: customer.id,
          message: text,
          conversation_history: conversationHistory,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errText}`);
      }

      const data = await res.json();

      // Capture all values immediately before async delay (prevents stale closure)
      const replyText = data.reply_message || "";
      const newHistory = data.conversation_history || conversationHistory;
      const newIntent = data.intent || null;
      const newSentiment = data.sentiment || null;
      const newStatus = data.enrollment_status || enrollmentStatus;

      // Realistic typing delay based on reply length
      const typingMs = Math.min(Math.max(replyText.length * 20 || 1000, 800), 3500);
      await new Promise((r) => setTimeout(r, typingMs));

      const agentMsg = {
        id: Date.now() + 1,
        from: "agent",
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        status: "read",
      };

      setMessages((prev) => [...prev, agentMsg]);
      setConversationHistory(newHistory);
      if (newIntent) setLastIntent(newIntent);
      if (newSentiment) setLastSentiment(newSentiment);

      if (newStatus !== enrollmentStatus) {
        setEnrollmentStatus(newStatus);
        onEnrollmentUpdate(newStatus);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 2, from: "agent", text: "Sorry, there was an error. Please try again.", time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), status: "read" },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const statusBadge = {
    pending: { bg: "#fef3c722", color: "#f59e0b", text: "Conversation Active" },
    enrolled: { bg: "#d1fae522", color: "#22c55e", text: "✅ Enrolled" },
    opted_out: { bg: "#fee2e222", color: "#ef4444", text: "Opted Out" },
  };
  const badge = statusBadge[enrollmentStatus];

  return (
    <div style={{ height: "calc(100vh - 60px)", display: "flex", flexDirection: "column", maxWidth: 480, margin: "0 auto", background: "#0a0f1e" }}>

      {/* WhatsApp Header */}
      <div style={{ background: "#128c7e", padding: "10px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#fff", fontSize: 20, cursor: "pointer", padding: 0, lineHeight: 1 }}>←</button>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#075e54", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🏦</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 15, color: "#fff" }}>SBI LifePulse</div>
          <div style={{ fontSize: 12, color: "#b2dfdb" }}>
            {isTyping ? "typing..." : `Chatting with ${customer.name.split(" ")[0]}`}
          </div>
        </div>
        <div style={{ fontSize: 12, padding: "3px 10px", borderRadius: 99, background: badge?.bg, color: badge?.color, fontWeight: 600 }}>
          {badge?.text}
        </div>
        <TranscriptExporter customer={customer} session={session} messages={messages} />
      </div>

      {/* Chat background */}
      <div style={{ flex: 1, overflowY: "auto", padding: "1rem", background: "#0d1a14", backgroundImage: "radial-gradient(circle at 1px 1px, #1a2b1f 1px, transparent 0)", backgroundSize: "24px 24px" }}>

        {/* Date divider */}
        <div style={{ textAlign: "center", marginBottom: "1rem" }}>
          <span style={{ background: "#1a2b1f", color: "#94a3b8", fontSize: 12, padding: "4px 12px", borderRadius: 99 }}>Today</span>
        </div>

        {messages.map((msg) => (
          <div key={msg.id} style={{ display: "flex", justifyContent: msg.from === "user" ? "flex-end" : "flex-start", marginBottom: "0.5rem" }}>
            <div style={{
              maxWidth: "78%",
              padding: "8px 12px",
              borderRadius: msg.from === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
              background: msg.from === "user" ? "#005c4b" : "#1f2c34",
              color: "#e9edef",
              fontSize: 14,
              lineHeight: 1.5,
              position: "relative",
            }}>
              <div style={{ whiteSpace: "pre-wrap" }}>{msg.text}</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4, marginTop: 4 }}>
                <span style={{ fontSize: 11, color: "#8696a0" }}>{msg.time}</span>
                {msg.from === "user" && (
                  <span style={{ fontSize: 12, color: msg.status === "read" ? "#53bdeb" : "#8696a0" }}>
                    {msg.status === "read" ? "✓✓" : "✓"}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "0.5rem" }}>
            <div style={{ background: "#1f2c34", borderRadius: "12px 12px 12px 2px", padding: "12px 16px", display: "flex", gap: 4, alignItems: "center" }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#8696a0", animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Sentiment indicator */}
      {lastSentiment && (
        <div style={{ background: "#1f2c34", padding: "4px 14px", display: "flex", gap: 8, alignItems: "center", borderTop: "1px solid #2a3942" }}>
          <span style={{ fontSize: 10, color: "#475569" }}>Sentiment:</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: lastSentiment.label === "positive" || lastSentiment.label === "highly_positive" ? "#22c55e" : lastSentiment.label === "frustrated" || lastSentiment.label === "negative" ? "#ef4444" : "#94a3b8" }}>
            {lastSentiment.label}
          </span>
          {lastIntent && (
            <>
              <span style={{ fontSize: 10, color: "#334155" }}>·</span>
              <span style={{ fontSize: 10, color: "#475569" }}>Intent:</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: lastIntent.intent === "STRONG_YES" ? "#22c55e" : lastIntent.intent === "REJECTION" ? "#ef4444" : "#f59e0b" }}>
                {lastIntent.intent?.replace(/_/g, " ")}
              </span>
            </>
          )}
        </div>
      )}

      {/* Input bar */}
      <div style={{ background: "#1f2c34", padding: "10px 12px", display: "flex", alignItems: "center", gap: 10, borderTop: "1px solid #2a3942" }}>
        <div style={{ flex: 1, background: "#2a3942", borderRadius: 24, padding: "10px 16px", display: "flex", alignItems: "center" }}>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={enrollmentStatus === "enrolled" ? "Enrollment complete! 🎉" : "Type a message..."}
            disabled={enrollmentStatus === "opted_out"}
            style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#e9edef", fontSize: 14, fontFamily: "inherit" }}
          />
        </div>
        <button
          onClick={sendMessage}
          disabled={!input.trim() || isTyping || enrollmentStatus === "opted_out"}
          style={{ width: 44, height: 44, borderRadius: "50%", background: input.trim() && !isTyping ? "#00a884" : "#2a3942", border: "none", cursor: input.trim() && !isTyping ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, transition: "background 0.2s" }}
        >
          ➤
        </button>
      </div>

      <style>{`
        @keyframes bounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-6px); } }
      `}</style>
    </div>
  );
}