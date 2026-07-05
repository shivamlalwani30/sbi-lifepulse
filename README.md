# ⚡ SBI LifePulse — Agentic AI for Proactive Customer Engagement
**Team Glucon-D** | Shivam Lalwani & Aanya Singh
**SBI Hackathon @ GFF 2026** | Digital Engagement | Prize: ₹2.5 Lakhs

---

## Quick Start

```bash
cp .env.example .env          # Add ANTHROPIC_API_KEY
cd backend && pip install -r requirements.txt && uvicorn main:app --reload
cd frontend && npm install && npm run dev   # new terminal
```

Mac/Linux: `./start.sh` | Windows: `start.bat`

**No API key?** The app still works — offline cache covers all 12 customers.

---

## 26 Pages

### Demo & Presentation
| URL | Purpose |
|-----|---------|
| `/demo` | **GFF stage screen** — 3-panel fullscreen, customer selector |
| `/m` | **Mobile demo** — jury scans QR, interacts on their phone |
| `/qr` | QR code generator for slide deck |
| `/simulate` | 🔴 Live simulation — synthetic customers streaming |
| `/yono` | YONO in-app mockup — phone frame with live Claude chat |

### Intelligence & Analysis  
| URL | Purpose |
|-----|---------|
| `/` | Dashboard — 12 customers, pipelines, event feed |
| `/analytics` | Conversion funnel, A/B testing, scale calculator |
| `/feedback` | Agent 5 — outcome learning, threshold calibration |
| `/risk` | Churn risk, upsell readiness, credit opportunity |
| `/business` | Customer LTV, competitor comparison |
| `/multilingual` | Hindi, Tamil, Telugu, Bengali, Marathi messages |

### Operations
| URL | Purpose |
|-----|---------|
| `/batch` | Parallel batch engine — all customers at once |
| `/webhook` | Finacle transaction simulator — push live events |
| `/campaigns` | Production cron schedule + SLA guarantees |
| `/fraud` | Pre-send fraud gate — 6 detection checks |
| `/twilio` | Real WhatsApp setup + one-click jury send |
| `/eligibility` | Product eligibility pre-check + fallback chain |
| `/deeplink` | Pre-filled YONO deeplinks for 1-tap enrollment |

### Knowledge & Pitch
| URL | Purpose |
|-----|---------|
| `/scale` | Architecture + 3-phase rollout + ₹2,520 Cr numbers |
| `/agents` | Agent explainer — input/output/jury Q&A per agent |
| `/performance` | Live agent timing benchmark — proves 8-sec SLA |
| `/pitch` | **Pitch kit** — all numbers, jury Q&A, one-click copy |
| `/preflight` | ✅ 24 system checks — run 30 min before GFF |

### Customer Detail
| URL | Purpose |
|-----|---------|
| `/customer/[id]` | 360° profile — 7 tabs: overview, transactions, signals, eligibility, fraud, CLV, deeplink |

---

## 6 Agents + 10 Support Modules

```
Core Agents:
  behavior_monitor.py       Pandas transaction analysis → behavioral signals
  life_event_detector.py    Rule scoring → life event + confidence (6 types)
  personalization_agent.py  Claude → personalized WhatsApp message (8 languages)
  conversational_close.py   Claude → enrollment conversation to completion
  feedback_loop.py          Outcome learning → auto-calibrates thresholds
  multilingual_agent.py     Claude → Hindi/Tamil/Telugu/Bengali/Marathi/Kannada/Malayalam/Gujarati

Support Agents:
  intent_classifier.py      Zero-latency reply intent (STRONG_YES/REJECTION/etc.)
  sentiment_tracker.py      Conversation sentiment → strategy recommendation
  eligibility_checker.py    Product eligibility pre-check + fallback chain
  fraud_detector.py         6-check pre-send safety gate
  risk_scoring.py           Churn/upsell/credit/dormancy scores
  clv_calculator.py         5-year + lifetime customer value
  yono_deeplink.py          Pre-filled app deeplinks for 1-tap enrollment
  product_catalog.py        8 real SBI products with eligibility rules

Infrastructure:
  session_store.py          SQLite persistent conversation memory + opt-out
  demo_cache.py             Offline fallback — works without API key
  ab_testing.py             3 message variants, conversion tracking
  scale_metrics.py          Configurable ₹2,520 Cr impact calculator
  batch_engine.py           Async parallel processing
  campaign_scheduler.py     6 production campaigns + cron schedule
  twilio_integration.py     Real WhatsApp delivery (optional)
```

---

## 12 Mock Customers (6 life events × 2 cities each)

| ID | Name | City | Life Event | Product |
|----|------|------|-----------|---------|
| CUST001 | Priya Sharma | Mumbai | Salary Hike +50% | SIP |
| CUST002 | Arjun Mehta | Pune→Bengaluru | Relocation | Card Upgrade |
| CUST003 | Sunita Devi | Lucknow | New EMI | Term Insurance |
| CUST004 | Rahul Verma | Hyderabad | Insurance Gap | Smart Protect |
| CUST005 | Kavya Reddy | Chennai | Marriage | Joint Acct + Home Loan |
| CUST006 | Deepak Nair | Kochi | New Baby | Child Plan |
| CUST007 | Meera Pillai | Thiruvananthapuram | Salary Hike +60% | SIP |
| CUST008 | Ravi Kumar | Patna | Insurance Gap | Smart Protect |
| CUST009 | Ananya Das | Kolkata | New Baby | Child Plan |
| CUST010 | Suresh Gowda | Mysuru→Pune | Relocation | Card Upgrade |
| CUST011 | Fatima Sheikh | Pune | Marriage | Joint Acct + Home Loan |
| CUST012 | Vikram Yadav | Jaipur | New EMI (Car+Home) | Term Insurance |

---

## Before Every Demo

```bash
cd backend && python3 test_suite.py
# → 🏆 ALL 227 TESTS PASS — DEMO READY!
```

Then open `localhost:3000/preflight` — 24 live system checks.

---

## Key Numbers (for jury)

- **₹2,520 Cr/yr** — revenue uplift at 500M customer scale
- **175,000×** — ROI on ₹0.02 API cost per customer
- **8 languages** — auto-detected from city
- **6 fraud checks** — pre-send safety gate
- **8 product eligibility rules** — no bad offers
- **227 automated tests** — 100% pass rate
- **26 pages** — dashboard to QR code
- **< 8 seconds** — end-to-end pipeline SLA
- **Works offline** — demo cache covers all 12 customers without API key

---

## Optional: Real WhatsApp (Twilio)

```bash
# Add to .env:
TWILIO_ACCOUNT_SID=ACxxxxxxxx
TWILIO_AUTH_TOKEN=your_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
TWILIO_DEMO_PHONE=whatsapp:+91XXXXXXXXXX

# Then go to /twilio and hit "Send Real WhatsApp"
```

---

*Team Glucon-D · SBI Hackathon @ GFF 2026*
*Shivam Lalwani & Aanya Singh*
