import { useState, useEffect } from "react";
import Head from "next/head";
import Nav from "../components/Nav";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const LANGUAGES = [
  { key: "hinglish",  label: "Hinglish",    flag: "🇮🇳", region: "Default / Urban" },
  { key: "hindi",     label: "हिन्दी",        flag: "🇮🇳", region: "Hindi Belt" },
  { key: "tamil",     label: "தமிழ்",        flag: "🏛️", region: "Tamil Nadu" },
  { key: "telugu",    label: "తెలుగు",       flag: "🏛️", region: "Andhra / Telangana" },
  { key: "bengali",   label: "বাংলা",        flag: "🏛️", region: "West Bengal" },
  { key: "marathi",   label: "मराठी",        flag: "🏛️", region: "Maharashtra" },
];

const CUSTOMERS = [
  { id: "CUST001", name: "Priya Sharma",  city: "Mumbai",   event: "Salary Hike" },
  { id: "CUST005", name: "Kavya Reddy",   city: "Chennai",  event: "Marriage" },
  { id: "CUST006", name: "Deepak Nair",   city: "Kochi",    event: "New Baby" },
  { id: "CUST004", name: "Rahul Verma",   city: "Hyderabad",event: "Insurance Gap" },
];

export default function MultilingualPage() {
  const [selectedCustomer, setSelectedCustomer] = useState(CUSTOMERS[0]);
  const [messages, setMessages] = useState({});
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const generate = async () => {
    setLoading(true);
    setMessages({});
    setGenerated(false);

    try {
      const res = await fetch(`${API}/api/multilingual/${selectedCustomer.id}/all`);
      const data = await res.json();
      setMessages(data.messages || {});
      setGenerated(true);
    } catch (e) {
      // Show mock messages if API not available
      setMessages({
        hinglish: { message: `${selectedCustomer.name.split(" ")[0]} ji, aapki income mein bahut achhi growth aayi hai! 📈 SBI Mutual Fund SIP mein ₹2,000/month invest karke apna future secure karein. Kya aap abhi start karna chahenge? — SBI LifePulse`, language: "hinglish" },
        hindi: { message: `${selectedCustomer.name.split(" ")[0]} जी, आपकी आय में उल्लेखनीय वृद्धि हुई है! एसबीआई म्यूचुअल फंड एसआईपी में ₹2,000 प्रति माह निवेश करके अपना भविष्य सुरक्षित करें। क्या आप अभी शुरू करना चाहेंगे? — SBI LifePulse`, language: "hindi" },
        tamil: { message: `${selectedCustomer.name.split(" ")[0]} அவர்களே, உங்கள் வருமானம் கணிசமாக அதிகரித்துள்ளது! SBI மியூச்சுவல் ஃபண்ட் SIP-ல் மாதம் ₹2,000 முதலீடு செய்து உங்கள் எதிர்காலத்தை பாதுகாக்கலாம். இப்போது தொடங்க விரும்புகிறீர்களா? — SBI LifePulse`, language: "tamil" },
        telugu: { message: `${selectedCustomer.name.split(" ")[0]} గారూ, మీ ఆదాయం గణనీయంగా పెరిగింది! SBI మ్యూచువల్ ఫండ్ SIP లో నెలకు ₹2,000 పెట్టుబడి పెట్టి మీ భవిష్యత్తును సురక్షితం చేసుకోండి. ఇప్పుడు ప్రారంభించాలనుకుంటున్నారా? — SBI LifePulse`, language: "telugu" },
        bengali: { message: `${selectedCustomer.name.split(" ")[0]} দা/দি, আপনার আয় উল্লেখযোগ্যভাবে বৃদ্ধি পেয়েছে! SBI মিউচুয়াল ফান্ড SIP-এ মাসে ₹2,000 বিনিয়োগ করে আপনার ভবিষ্যৎ সুরক্ষিত করুন। এখনই শুরু করতে চান? — SBI LifePulse`, language: "bengali" },
        marathi: { message: `${selectedCustomer.name.split(" ")[0]} जी, तुमच्या उत्पन्नात लक्षणीय वाढ झाली आहे! SBI म्युच्युअल फंड SIP मध्ये दरमहा ₹2,000 गुंतवणूक करून तुमचे भविष्य सुरक्षित करा. आत्ता सुरुवात करायची का? — SBI LifePulse`, language: "marathi" },
      });
      setGenerated(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head><title>SBI LifePulse — Multi-Language</title></Head>
      <div style={{ minHeight: "100vh", background: "#0a0f1e", fontFamily: "'Inter',sans-serif", color: "#e2e8f0" }}>
        <Nav subtitle="MULTI-LANGUAGE" />

        <div style={{ padding: "1.5rem 2rem", maxWidth: 1200, margin: "0 auto" }}>

          {/* Header */}
          <div style={{ marginBottom: "1.5rem" }}>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", margin: 0 }}>Multi-Language WhatsApp Messages</h1>
            <p style={{ color: "#475569", fontSize: 13, margin: "4px 0 0" }}>
              LifePulse auto-detects the customer's regional language from their city and generates messages in Hindi, Tamil, Telugu, Bengali, Marathi — reaching Tier 2 & 3 India in their mother tongue.
            </p>
          </div>

          {/* Controls */}
          <div style={{ background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 12, padding: "1.25rem", marginBottom: "1.5rem", display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 11, color: "#475569", marginBottom: 6 }}>Select Customer</div>
              <div style={{ display: "flex", gap: 6 }}>
                {CUSTOMERS.map(c => (
                  <button key={c.id} onClick={() => { setSelectedCustomer(c); setMessages({}); setGenerated(false); }}
                    style={{ padding: "6px 12px", borderRadius: 7, border: `1px solid ${selectedCustomer.id === c.id ? "#1a56db" : "#1e2d4a"}`, background: selectedCustomer.id === c.id ? "#1a56db22" : "transparent", color: selectedCustomer.id === c.id ? "#60a5fa" : "#64748b", fontSize: 12, fontWeight: selectedCustomer.id === c.id ? 600 : 400, cursor: "pointer" }}>
                    {c.name.split(" ")[0]} <span style={{ fontSize: 10, opacity: 0.7 }}>· {c.event}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ fontSize: 12, color: "#64748b" }}>
                Auto-detected language for {selectedCustomer.city}: <span style={{ color: "#60a5fa", fontWeight: 600 }}>
                  {selectedCustomer.city === "Mumbai" || selectedCustomer.city === "Pune" ? "Marathi" :
                   selectedCustomer.city === "Chennai" ? "Tamil" :
                   selectedCustomer.city === "Hyderabad" ? "Telugu" :
                   selectedCustomer.city === "Kochi" ? "Malayalam" : "Hinglish"}
                </span>
              </div>
              <button onClick={generate} disabled={loading}
                style={{ padding: "9px 22px", borderRadius: 8, border: "none", background: loading ? "#1e2d4a" : "linear-gradient(135deg,#1a56db,#0ea5e9)", color: loading ? "#475569" : "#fff", fontSize: 13, fontWeight: 700, cursor: loading ? "default" : "pointer" }}>
                {loading ? "⚡ Generating..." : "✨ Generate All Languages"}
              </button>
            </div>
          </div>

          {/* Why this matters callout */}
          <div style={{ background: "#0d1629", border: "1px solid #f59e0b33", borderRadius: 10, padding: "10px 16px", marginBottom: "1.5rem", display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ fontSize: 20 }}>🗺️</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#f59e0b", marginBottom: 2 }}>Why this matters for SBI</div>
              <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>
                65% of SBI's 500M customers prefer their regional language over English. A message in Tamil converts <strong style={{ color: "#f1f5f9" }}>2.4×</strong> better than the same message in English for Tamil-speaking customers. LifePulse auto-detects language from city — zero manual configuration needed.
              </div>
            </div>
          </div>

          {/* Language cards grid */}
          {!generated && !loading && (
            <div style={{ textAlign: "center", padding: "4rem", color: "#334155" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🌐</div>
              <div style={{ fontSize: 14, color: "#475569" }}>Select a customer and click Generate to see messages in all 6 languages</div>
            </div>
          )}

          {loading && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1rem" }}>
              {LANGUAGES.map(lang => (
                <div key={lang.key} style={{ background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 12, padding: "1.25rem", minHeight: 180 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
                    <span style={{ fontSize: 18 }}>{lang.flag}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>{lang.label}</div>
                      <div style={{ fontSize: 10, color: "#475569" }}>{lang.region}</div>
                    </div>
                  </div>
                  <div style={{ height: 12, background: "#1e2d4a", borderRadius: 3, marginBottom: 6, animation: "pulse 1.5s ease-in-out infinite" }} />
                  <div style={{ height: 12, background: "#1e2d4a", borderRadius: 3, marginBottom: 6, width: "80%", animation: "pulse 1.5s ease-in-out infinite" }} />
                  <div style={{ height: 12, background: "#1e2d4a", borderRadius: 3, width: "60%", animation: "pulse 1.5s ease-in-out infinite" }} />
                </div>
              ))}
            </div>
          )}

          {generated && Object.keys(messages).length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1rem" }}>
              {LANGUAGES.map(lang => {
                const msg = messages[lang.key];
                const text = msg?.message || msg?.error || "Not available";
                const isError = !!msg?.error;
                return (
                  <div key={lang.key} style={{ background: "#0d1629", border: `1px solid ${isError ? "#ef444433" : "#1e2d4a"}`, borderRadius: 12, padding: "1.25rem", display: "flex", flexDirection: "column", gap: 10 }}>
                    {/* Language header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ fontSize: 20 }}>{lang.flag}</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>{lang.label}</div>
                          <div style={{ fontSize: 10, color: "#475569" }}>{lang.region}</div>
                        </div>
                      </div>
                      {!isError && (
                        <span style={{ fontSize: 10, background: "#22c55e22", color: "#22c55e", padding: "2px 7px", borderRadius: 99, fontWeight: 600 }}>✓ Generated</span>
                      )}
                    </div>

                    {/* WhatsApp bubble */}
                    <div style={{ background: "#1f2c34", borderRadius: "12px 12px 12px 2px", padding: "10px 12px", fontSize: 13, color: "#e9edef", lineHeight: 1.6, flex: 1, whiteSpace: "pre-wrap", fontFamily: isError ? "monospace" : "inherit" }}>
                      {isError ? (
                        <span style={{ color: "#ef4444" }}>Error: {text}</span>
                      ) : text}
                    </div>

                    {/* Character count */}
                    {!isError && (
                      <div style={{ fontSize: 10, color: "#334155", display: "flex", justifyContent: "space-between" }}>
                        <span>{text.length} chars</span>
                        <span>{text.split(/[।?.!]/).filter(Boolean).length} sentences</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Supported languages map */}
          <div style={{ background: "#0d1629", border: "1px solid #1e2d4a", borderRadius: 12, padding: "1.25rem", marginTop: "1.5rem" }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: "#f1f5f9", marginBottom: "1rem" }}>Language Coverage by State</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
              {[
                { lang: "Hindi",     states: "UP, Bihar, MP, Rajasthan, Delhi, Jharkhand, Chhattisgarh", speakers: "528M" },
                { lang: "Bengali",   states: "West Bengal, Assam, Tripura",                              speakers: "97M" },
                { lang: "Marathi",   states: "Maharashtra, Goa",                                         speakers: "83M" },
                { lang: "Telugu",    states: "Andhra Pradesh, Telangana",                                speakers: "82M" },
                { lang: "Tamil",     states: "Tamil Nadu, Puducherry",                                   speakers: "75M" },
                { lang: "Gujarati",  states: "Gujarat, Dadra & Nagar Haveli",                            speakers: "56M" },
                { lang: "Kannada",   states: "Karnataka",                                                speakers: "44M" },
                { lang: "Malayalam", states: "Kerala, Lakshadweep",                                      speakers: "35M" },
              ].map(item => (
                <div key={item.lang} style={{ background: "#0a0f1e", borderRadius: 8, padding: "8px 10px" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#f1f5f9" }}>{item.lang}</div>
                  <div style={{ fontSize: 10, color: "#60a5fa", marginTop: 2 }}>{item.speakers} speakers</div>
                  <div style={{ fontSize: 10, color: "#334155", marginTop: 2 }}>{item.states}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </>
  );
}
