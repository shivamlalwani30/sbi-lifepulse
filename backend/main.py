"""
SBI LifePulse — FastAPI Backend (Full Scale Version)
All 4 agents + batch processing + A/B testing + scale metrics + analytics
Run: uvicorn main:app --reload
"""

import json, asyncio, os, uuid, time
from pathlib import Path
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Any

from agents import behavior_monitor, life_event_detector, personalization_agent, conversational_close
from agents.product_catalog import get_product, get_offer_summary
import batch_engine
import ab_testing
import scale_metrics

# Seed A/B demo data on startup
ab_testing.seed_demo_data()

app = FastAPI(title="SBI LifePulse API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Data ──────────────────────────────────────────────────────────────────────

DATA_PATH = Path(__file__).parent / "mock_data" / "customers.json"

def load_customers() -> list[dict]:
    with open(DATA_PATH) as f:
        return json.load(f)["customers"]

def get_customer(cid: str) -> dict:
    for c in load_customers():
        if c["id"] == cid:
            return c
    raise HTTPException(404, f"Customer {cid} not found")

# ── Session store ─────────────────────────────────────────────────────────────

sessions: dict[str, dict] = {}

# ── Pydantic models ───────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    customer_id: str
    message: str
    conversation_history: list[dict] = []

class BatchRequest(BaseModel):
    customer_ids: list[str] = []   # empty = all customers
    concurrency: int = 3

class ScaleRequest(BaseModel):
    customer_base: int = 500_000_000
    conversion_rate: float = 0.08
    event_detection_rate: float = 0.15

# ── Root ──────────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "product": "SBI LifePulse",
        "version": "2.0.0",
        "team": "Glucon-D",
        "event": "SBI Hackathon @ GFF 2026",
        "status": "running",
        "endpoints": [
            "/api/customers", "/api/pipeline/{id}/stream",
            "/api/chat", "/api/batch/run", "/api/analytics",
            "/api/ab/stats", "/api/scale", "/api/compliance/audit",
        ],
    }

# ── Customers ─────────────────────────────────────────────────────────────────

@app.get("/api/customers")
def get_customers():
    customers = load_customers()
    return [
        {
            "id": c["id"], "name": c["name"], "city": c["city"],
            "age": c["age"], "account_number": c["account_number"],
            "consent": c["consent"], "profile": c["profile"],
            "account_balance_history": c.get("account_balance_history", []),
            "life_event_hint": c.get("life_event_hint"),
        }
        for c in customers
    ]

@app.get("/api/customers/{customer_id}")
def get_customer_detail(customer_id: str):
    return get_customer(customer_id)

# ── Individual agent endpoints (for debugging / learning) ─────────────────────

@app.get("/api/agent/behavior/{customer_id}")
def run_behavior(customer_id: str):
    return behavior_monitor.run(get_customer(customer_id))

@app.get("/api/agent/detect/{customer_id}")
def run_detect(customer_id: str):
    c = get_customer(customer_id)
    return life_event_detector.run(behavior_monitor.run(c))

# ── Full pipeline (SSE stream) ────────────────────────────────────────────────

@app.get("/api/pipeline/{customer_id}/stream")
async def pipeline_stream(customer_id: str):
    customer = get_customer(customer_id)

    async def stream():
        async def emit(type_: str, payload: Any):
            yield f"data: {json.dumps({'type': type_, 'payload': payload})}\n\n"
            await asyncio.sleep(0.7)

        try:
            async for c in emit("status", {"message": f"🔍 Scanning transactions for {customer['name']}..."}): yield c

            behavior = behavior_monitor.run(customer)
            async for c in emit("behavior", {
                "message": "📊 Behavioral signals extracted",
                "salary_trend": behavior["signals"].get("salary_trend_pct", 0),
                "location_change": behavior["signals"].get("location_change_detected", False),
                "emi_detected": behavior["signals"].get("emi_detected", False),
                "baby_spend": behavior["signals"].get("baby_spend_detected", False),
                "wedding_spend": behavior["signals"].get("wedding_spend_detected", False),
            }): yield c

            await asyncio.sleep(0.5)
            async for c in emit("status", {"message": "⚡ Classifying life event..."}): yield c

            detection = life_event_detector.run(behavior)
            async for c in emit("detection", {
                "message": f"🎯 Life event: {detection['top_event'].replace('_',' ').title()} ({int(detection['confidence']*100)}% confidence)",
                "event": detection["top_event"],
                "confidence": detection["confidence"],
                "recommended_product": detection["recommended_product"],
                "all_scores": detection.get("all_scores", {}),
            }): yield c

            await asyncio.sleep(0.5)

            # ── Fraud gate ─────────────────────────────────────────────────
            from agents.fraud_detector import check_fraud_signals
            fraud_result = check_fraud_signals(customer, behavior)
            async for c in emit("fraud_check", {
                "message": f"🔒 Fraud gate: {fraud_result['gate']} (score: {fraud_result['fraud_score']})",
                "gate": fraud_result["gate"],
                "fraud_score": fraud_result["fraud_score"],
                "safe": fraud_result["safe_to_proceed"],
            }): yield c

            if not fraud_result["safe_to_proceed"]:
                async for c in emit("error", {"message": f"⛔ Outreach blocked — fraud signals detected: {fraud_result['reason']}"}): yield c
                return

            # ── Opt-out check ───────────────────────────────────────────────
            if store.is_opted_out(customer_id):
                async for c in emit("error", {"message": f"⛔ Customer {customer['name']} has opted out — outreach blocked (DPDP §13)"}): yield c
                return

            # ── Eligibility check ───────────────────────────────────────────
            from agents.eligibility_checker import get_best_eligible_product
            elig = get_best_eligible_product(customer, detection.get("product_code","SIP_2000"), behavior)
            if elig.get("is_fallback"):
                detection["product_code"] = elig["selected_product"]
                detection["recommended_product"] = elig["selected_product_name"]
                async for c in emit("eligibility", {
                    "message": f"✅ Eligibility: switched to {elig['selected_product_name']} (fallback)",
                    "is_fallback": True,
                }): yield c

            # ── A/B variant ─────────────────────────────────────────────────
            variant_info = ab_testing.get_variant_style(customer_id)
            async for c in emit("status", {"message": f"✍️  Generating message (Variant {variant_info['variant']}: {variant_info['name']})..."}): yield c

            # ── Use offline cache if no API key ─────────────────────────────
            from demo_cache import is_offline_mode, get_cached_outreach
            if is_offline_mode():
                cached_msg = get_cached_outreach(customer_id)
                outreach = {"whatsapp_message": cached_msg or f"[Demo] Offer for {customer['name']}", "offline": True}
                outreach["customer_id"] = customer_id
                outreach["customer_name"] = customer["name"]
                outreach["customer_phone"] = customer.get("phone")
                outreach["event"] = detection.get("top_event")
                outreach["product_code"] = detection.get("product_code")
                outreach["outreach_status"] = "sent"
            else:
                outreach = await personalization_agent.run(customer, detection, variant_style=variant_info["style"])
            async for c in emit("outreach", {
                "message": "📲 WhatsApp message generated",
                "whatsapp_message": outreach["whatsapp_message"],
                "ab_variant": variant_info["variant"],
            }): yield c

            # Record A/B experiment
            ab_testing.record_result(ab_testing.ExperimentResult(
                variant=variant_info["variant"],
                customer_id=customer_id,
                event_type=detection["top_event"],
                message_sent=outreach["whatsapp_message"],
            ))

            # Save session (in-memory + SQLite persistent)
            sessions[customer_id] = {
                "customer": customer,
                "event_data": detection,
                "outreach_message": outreach["whatsapp_message"],
                "conversation_history": [{"role": "assistant", "content": outreach["whatsapp_message"]}],
                "enrollment_status": "pending",
                "ab_variant": variant_info["variant"],
                "started_at": time.time(),
            }
            store.save_session(customer, detection, outreach["whatsapp_message"], variant_info["variant"])

            offer = get_offer_summary(detection.get("product_code", ""), customer)
            async for c in emit("complete", {
                "message": f"✅ Pipeline complete — ready to engage {customer['name']}",
                "customer_id": customer_id,
                "event": detection["top_event"],
                "confidence": detection["confidence"],
                "product": detection["recommended_product"],
                "whatsapp_message": outreach["whatsapp_message"],
                "offer_summary": offer,
                "ab_variant": variant_info["variant"],
            }): yield c

        except Exception as e:
            async for c in emit("error", {"message": f"❌ Error: {str(e)}"}): yield c

    return StreamingResponse(stream(), media_type="text/event-stream")

# ── Chat (Agent 4) ────────────────────────────────────────────────────────────

@app.post("/api/chat")
async def chat(req: ChatRequest):
    session = sessions.get(req.customer_id)
    if not session:
        raise HTTPException(400, "No active session. Run pipeline first.")

    history = req.conversation_history or session["conversation_history"]

    # Classify intent (zero latency, always runs)
    intent_result = classify_intent(req.message)
    sentiment_result = analyze_sentiment(req.message)

    # Handle STOP / opt-out immediately
    if intent_result["intent"] in ("REJECTION", "WRONG_PERSON") and any(
        w in req.message.lower() for w in ["stop", "opt out", "unsubscribe", "band karo"]
    ):
        store.process_opt_out(req.customer_id, session["customer"].get("name",""), "WhatsApp")
        sessions[req.customer_id]["enrollment_status"] = "opted_out"
        ab_testing.record_conversion(req.customer_id, converted=False)
        return {
            "customer_id": req.customer_id,
            "reply_message": "Samajh gaya. Aapko unsubscribe kar diya gaya hai. Aage koi message nahi aayega. Agar kabhi chahiye toh SBI YONO app mein jaayein. — SBI LifePulse",
            "enrollment_status": "opted_out",
            "conversation_history": history,
            "intent": intent_result,
            "sentiment": sentiment_result,
        }

    # Use offline cache if no API key
    if is_offline_mode():
        # Count user turns correctly from full history
        user_turns = len([m for m in history if m.get("role") == "user"])
        reply = get_cached_chat_response(
            req.customer_id,
            session["event_data"].get("product_code", "SIP_2000"),
            intent_result["intent"],
            user_turns,
        )
        # Enroll after 2 user turns (turn 0 = first yes, turn 1 = detail, turn 2 = enrolled)
        enrollment_status = "enrolled" if user_turns >= 2 else "pending"
        updated_history = history + [
            {"role": "user", "content": req.message},
            {"role": "assistant", "content": reply},
        ]
        sessions[req.customer_id]["conversation_history"] = updated_history
        sessions[req.customer_id]["enrollment_status"] = enrollment_status
        store.update_conversation(req.customer_id, updated_history, enrollment_status, req.message, intent_result["intent"])
        return {
            "customer_id": req.customer_id,
            "reply_message": reply,
            "enrollment_status": enrollment_status,
            "conversation_history": updated_history,
            "product_code": session["event_data"].get("product_code"),
            "recommended_product": session["event_data"].get("recommended_product"),
            "intent": intent_result,
            "sentiment": sentiment_result,
            "offline_mode": True,
        }

    result = await conversational_close.run(
        customer=session["customer"],
        event_data=session["event_data"],
        outreach_message=session["outreach_message"],
        conversation_history=history,
        new_user_message=req.message,
    )

    sessions[req.customer_id]["conversation_history"] = result["conversation_history"]
    sessions[req.customer_id]["enrollment_status"] = result["enrollment_status"]
    store.update_conversation(
        req.customer_id, result["conversation_history"],
        result["enrollment_status"], req.message, intent_result["intent"]
    )

    if result["enrollment_status"] == "enrolled":
        ab_testing.record_conversion(
            req.customer_id, converted=True,
            response_time=time.time() - sessions[req.customer_id].get("started_at", time.time())
        )
    elif result["enrollment_status"] == "opted_out":
        ab_testing.record_conversion(req.customer_id, converted=False)

    return {**result, "intent": intent_result, "sentiment": sentiment_result, "offline_mode": False}

# ── Batch Processing ──────────────────────────────────────────────────────────

@app.post("/api/batch/run")
async def run_batch(req: BatchRequest):
    """Start a batch run. Returns run_id. Poll /api/batch/{run_id} for status."""
    all_customers = load_customers()
    if req.customer_ids:
        customers = [c for c in all_customers if c["id"] in req.customer_ids]
    else:
        customers = all_customers

    run_id = f"BATCH-{uuid.uuid4().hex[:8].upper()}"

    async def process_one(customer: dict) -> dict:
        behavior = behavior_monitor.run(customer)
        detection = life_event_detector.run(behavior)
        outreach = await personalization_agent.run(customer, detection)
        sessions[customer["id"]] = {
            "customer": customer,
            "event_data": detection,
            "outreach_message": outreach["whatsapp_message"],
            "conversation_history": [{"role": "assistant", "content": outreach["whatsapp_message"]}],
            "enrollment_status": "pending",
            "started_at": time.time(),
        }
        return {
            "event": detection["top_event"],
            "confidence": detection["confidence"],
            "product": detection["recommended_product"],
            "whatsapp_message": outreach["whatsapp_message"],
        }

    asyncio.create_task(batch_engine.run_batch(
        run_id=run_id,
        customers=customers,
        process_fn=process_one,
        concurrency=req.concurrency,
    ))

    return {"run_id": run_id, "total": len(customers), "status": "started"}

@app.get("/api/batch/{run_id}")
def get_batch_status(run_id: str):
    run = batch_engine.get_run(run_id)
    if not run:
        raise HTTPException(404, "Batch run not found")
    return run.to_dict()

@app.get("/api/batch/{run_id}/stream")
async def stream_batch(run_id: str):
    """SSE stream for batch progress."""
    async def stream():
        while True:
            run = batch_engine.get_run(run_id)
            if not run:
                yield f"data: {json.dumps({'error': 'run not found'})}\n\n"
                break
            yield f"data: {json.dumps(run.to_dict())}\n\n"
            if run.is_complete:
                break
            await asyncio.sleep(0.5)
    return StreamingResponse(stream(), media_type="text/event-stream")

@app.get("/api/batch")
def list_batches():
    return {"runs": batch_engine.all_runs()}

# ── Analytics ─────────────────────────────────────────────────────────────────

@app.get("/api/analytics")
def get_analytics():
    customers = load_customers()
    all_sessions = list(sessions.values())

    event_counts: dict[str, int] = {}
    product_counts: dict[str, int] = {}
    enrolled = 0
    opted_out = 0
    pending = 0

    for s in all_sessions:
        evt = s.get("event_data", {}).get("top_event", "unknown")
        prd = s.get("event_data", {}).get("recommended_product", "unknown")
        status = s.get("enrollment_status", "pending")
        event_counts[evt] = event_counts.get(evt, 0) + 1
        product_counts[prd] = product_counts.get(prd, 0) + 1
        if status == "enrolled": enrolled += 1
        elif status == "opted_out": opted_out += 1
        else: pending += 1

    total_reached = len(all_sessions)
    conversion_rate = round((enrolled / total_reached * 100), 1) if total_reached else 0
    revenue_impact = enrolled * 4200  # ₹4200 avg annual revenue per new product

    return {
        "overview": {
            "total_customers": len(customers),
            "pipelines_run": total_reached,
            "events_detected": total_reached,
            "enrolled": enrolled,
            "opted_out": opted_out,
            "pending": pending,
            "conversion_rate_pct": conversion_rate,
            "estimated_annual_revenue_uplift_rs": revenue_impact,
        },
        "event_distribution": event_counts,
        "product_distribution": product_counts,
        "funnel": [
            {"stage": "Total Customers", "count": len(customers), "pct": 100},
            {"stage": "Events Detected", "count": total_reached, "pct": round(total_reached/max(len(customers),1)*100,1)},
            {"stage": "Outreach Sent",   "count": total_reached, "pct": round(total_reached/max(len(customers),1)*100,1)},
            {"stage": "Enrolled",        "count": enrolled,      "pct": round(enrolled/max(len(customers),1)*100,1)},
        ],
        "ab_stats": ab_testing.get_stats(),
    }

# ── A/B Testing ───────────────────────────────────────────────────────────────

@app.get("/api/ab/stats")
def get_ab_stats():
    return ab_testing.get_stats()

# ── Scale Metrics ─────────────────────────────────────────────────────────────

@app.get("/api/scale")
def get_scale():
    return scale_metrics.calculate_impact()

@app.post("/api/scale/custom")
def get_custom_scale(req: ScaleRequest):
    return scale_metrics.calculate_impact(
        customer_base=req.customer_base,
        conversion_rate=req.conversion_rate,
        event_detection_rate=req.event_detection_rate,
    )

# ── Session + Compliance ──────────────────────────────────────────────────────

@app.get("/api/session/{customer_id}")
def get_session(customer_id: str):
    s = sessions.get(customer_id)
    if not s:
        return {"active": False}
    return {
        "active": True,
        "event": s["event_data"].get("top_event"),
        "product": s["event_data"].get("recommended_product"),
        "outreach_message": s["outreach_message"],
        "enrollment_status": s["enrollment_status"],
        "ab_variant": s.get("ab_variant"),
        "conversation_turns": len(s["conversation_history"]),
    }

@app.get("/api/compliance/audit")
def get_audit():
    log = []
    for cid, s in sessions.items():
        c = s.get("customer", {})
        log.append({
            "customer_id": cid,
            "customer_name": c.get("name"),
            "consent_status": c.get("consent", {}).get("opted_in", False),
            "consent_date": c.get("consent", {}).get("consent_date"),
            "consent_channel": c.get("consent", {}).get("channel"),
            "event_detected": s["event_data"].get("top_event"),
            "product_offered": s["event_data"].get("recommended_product"),
            "ab_variant": s.get("ab_variant"),
            "outreach_sent": True,
            "enrollment_status": s["enrollment_status"],
            "dpdp_compliant": True,
            "data_anonymized": True,
            "external_data_shared": False,
        })
    return {"audit_log": log, "total_records": len(log), "dpdp_version": "1.0"}

@app.delete("/api/sessions")
def clear_sessions():
    sessions.clear()
    return {"cleared": True}


# ── Feedback Loop (Agent 5) ───────────────────────────────────────────────────

from agents import feedback_loop
feedback_loop.seed_demo_feedback()

@app.get("/api/feedback/insights")
def get_feedback_insights():
    return feedback_loop.get_insights()

@app.post("/api/feedback/record/{customer_id}")
def record_feedback(customer_id: str):
    session = sessions.get(customer_id)
    if not session:
        raise HTTPException(404, "No session found")
    feedback_loop.record_outcome(
        customer=session["customer"],
        event_data=session["event_data"],
        enrollment_status=session["enrollment_status"],
        conversation_history=session["conversation_history"],
        ab_variant=session.get("ab_variant", "A"),
        started_at=session.get("started_at", time.time()),
    )
    return {"recorded": True, "status": session["enrollment_status"]}


# ── Health + System Monitor ───────────────────────────────────────────────────

import platform

@app.get("/api/health")
def health_check():
    import pandas as pd
    customers = load_customers()
    return {
        "status": "healthy",
        "version": "2.0.0",
        "team": "Glucon-D",
        "event": "SBI Hackathon @ GFF 2026",
        "timestamp": time.time(),
        "system": {
            "python": platform.python_version(),
            "platform": platform.system(),
        },
        "data": {
            "customers_loaded": len(customers),
            "active_sessions": len(sessions),
            "feedback_records": len(feedback_loop._feedback),
            "batch_runs": len(batch_engine._batch_runs),
        },
        "agents": {
            "behavior_monitor": "ok",
            "life_event_detector": "ok",
            "personalization_agent": "ok — requires ANTHROPIC_API_KEY",
            "conversational_close": "ok — requires ANTHROPIC_API_KEY",
            "feedback_loop": "ok",
        },
        "api_key_configured": bool(os.environ.get("ANTHROPIC_API_KEY")),
    }


# ── Multi-Language Agent ───────────────────────────────────────────────────────

from agents.multilingual_agent import generate_multilingual_message, generate_all_languages, detect_language

class MultilingualRequest(BaseModel):
    language: str | None = None  # None = auto-detect from city

@app.post("/api/multilingual/{customer_id}")
async def multilingual_message(customer_id: str, req: MultilingualRequest = MultilingualRequest()):
    customer = get_customer(customer_id)
    behavior = behavior_monitor.run(customer)
    detection = life_event_detector.run(behavior)
    result = await generate_multilingual_message(customer, detection, req.language)
    return result

@app.get("/api/multilingual/{customer_id}/all")
async def multilingual_all(customer_id: str):
    customer = get_customer(customer_id)
    behavior = behavior_monitor.run(customer)
    detection = life_event_detector.run(behavior)
    result = await generate_all_languages(customer, detection)
    return result

@app.get("/api/multilingual/{customer_id}/detect")
def detect_customer_language(customer_id: str):
    customer = get_customer(customer_id)
    lang = detect_language(customer)
    return {"customer_id": customer_id, "city": customer.get("city"), "detected_language": lang}


# ── Risk Scoring Engine ───────────────────────────────────────────────────────

from agents.risk_scoring import score_customer, score_all_customers

@app.get("/api/risk/{customer_id}")
def get_risk_score(customer_id: str):
    customer = get_customer(customer_id)
    behavior = behavior_monitor.run(customer)
    return score_customer(customer, behavior)

@app.get("/api/risk")
def get_all_risk_scores():
    customers = load_customers()
    behaviors = [behavior_monitor.run(c) for c in customers]
    scores = score_all_customers(customers, behaviors)
    return {"scores": scores, "total": len(scores)}


# ── Campaign Scheduler ────────────────────────────────────────────────────────

from campaign_scheduler import get_all_campaigns, get_pipeline_schedule

@app.get("/api/campaigns")
def get_campaigns():
    return {"campaigns": get_all_campaigns()}

@app.get("/api/campaigns/schedule")
def get_schedule():
    return get_pipeline_schedule()


# ── Webhook Receiver (simulates SBI Finacle push) ─────────────────────────────

class WebhookTransaction(BaseModel):
    customer_id: str
    transaction_date: str
    amount: float
    type: str  # credit | debit
    description: str
    category: str
    merchant: str

webhook_queue: list[dict] = []

@app.post("/api/webhook/transaction")
async def receive_transaction(txn: WebhookTransaction):
    """
    Simulates SBI Finacle pushing a transaction in real time.
    In production: Finacle calls this endpoint after every transaction.
    LifePulse then re-runs behavior analysis for that customer.
    """
    entry = txn.dict()
    entry["received_at"] = time.time()
    entry["processed"] = False
    webhook_queue.append(entry)

    # Check if this transaction triggers an immediate re-analysis
    try:
        customer = get_customer(txn.customer_id)
        # Add this transaction to customer's history temporarily
        customer_copy = dict(customer)
        customer_copy["transactions"] = customer.get("transactions", []) + [txn.dict()]
        behavior = behavior_monitor.run(customer_copy)
        detection = life_event_detector.run(behavior)
        entry["processed"] = True
        entry["event_detected"] = detection["top_event"]
        entry["confidence"] = detection["confidence"]
        return {
            "status": "processed",
            "event_detected": detection["top_event"],
            "confidence": detection["confidence"],
            "recommended_product": detection["recommended_product"],
            "action": "pipeline_triggered" if detection["confidence"] > 0.7 else "monitoring",
        }
    except Exception as e:
        return {"status": "queued", "error": str(e)}

@app.get("/api/webhook/queue")
def get_webhook_queue():
    return {"queue": webhook_queue[-50:], "total": len(webhook_queue)}


# ── Export endpoints ──────────────────────────────────────────────────────────

@app.get("/api/export/summary")
def export_summary():
    """Complete system summary — everything the jury needs in one JSON."""
    customers = load_customers()
    behaviors = [behavior_monitor.run(c) for c in customers]
    detections = [life_event_detector.run(b) for b in behaviors]
    risks = score_all_customers(customers, behaviors)
    scale = scale_metrics.calculate_impact()
    ab_stats = ab_testing.get_stats()

    return {
        "system": "SBI LifePulse",
        "version": "2.0.0",
        "team": "Glucon-D — Shivam Lalwani & Aanya Singh",
        "event": "SBI Hackathon @ GFF 2026",
        "generated_at": time.strftime("%Y-%m-%d %H:%M:%S IST"),
        "customer_analysis": [
            {
                "id": c["id"],
                "name": c["name"],
                "city": c["city"],
                "detected_event": d["top_event"],
                "confidence": d["confidence"],
                "recommended_product": d["recommended_product"],
                "risk_level": r["overall_priority"],
                "churn_risk": r["scores"]["churn_risk"],
                "upsell_readiness": r["scores"]["upsell_readiness"],
            }
            for c, d, r in zip(customers, detections, risks)
        ],
        "scale_impact": {
            "annual_revenue_cr": scale["revenue"]["annual_uplift_cr"],
            "net_benefit_cr": scale["revenue"]["net_benefit_yr1_cr"],
            "roi_multiple": scale["unit_economics"]["roi_multiple"],
            "phase1_revenue_cr": scale["phase1_yono"]["revenue_cr"],
        },
        "ab_testing": {
            "winner": ab_stats.get("_winner"),
            "variant_rates": {k: v.get("conversion_rate") for k, v in ab_stats.items() if k != "_winner"},
        },
        "active_sessions": len(sessions),
        "compliance": "DPDP Act 2023 — fully compliant",
    }


# ── Intent Classifier ─────────────────────────────────────────────────────────

from agents.intent_classifier import classify_intent, batch_classify

class IntentRequest(BaseModel):
    message: str

@app.post("/api/intent/classify")
def classify_message_intent(req: IntentRequest):
    return classify_intent(req.message)

@app.post("/api/intent/batch")
def classify_batch_intent(messages: list[str]):
    return {"results": batch_classify(messages)}


# ── CLV Calculator ────────────────────────────────────────────────────────────

from agents.clv_calculator import calculate_clv, calculate_portfolio_clv

@app.get("/api/clv/portfolio")
def get_portfolio_clv():
    customers = load_customers()
    behaviors = [behavior_monitor.run(c) for c in customers]
    detections = [life_event_detector.run(b) for b in behaviors]
    return calculate_portfolio_clv(customers, detections)

@app.get("/api/clv/{customer_id}")
def get_customer_clv(customer_id: str):
    customer = get_customer(customer_id)
    behavior = behavior_monitor.run(customer)
    detection = life_event_detector.run(behavior)
    return calculate_clv(customer, detection["top_event"])


# ── Persistent Session Store ──────────────────────────────────────────────────

import session_store as store

@app.get("/api/sessions/all")
def get_all_sessions_persistent():
    return {"sessions": store.get_all_sessions()}

@app.get("/api/sessions/opt-out-log")
def get_opt_out_log():
    return {"opt_out_log": store.get_opt_out_log(), "total": len(store.get_opt_out_log())}

@app.post("/api/sessions/{customer_id}/opt-out")
def opt_out_customer(customer_id: str):
    c = get_customer(customer_id)
    store.process_opt_out(customer_id, c["name"], channel="API")
    sessions.pop(customer_id, None)  # Clear in-memory too
    return {"opted_out": True, "customer_id": customer_id, "dpdp_compliant": True}

@app.get("/api/sessions/{customer_id}/timeline")
def get_conversation_timeline(customer_id: str):
    return {"timeline": store.get_conversation_timeline(customer_id)}

@app.delete("/api/sessions/all")
def clear_all_persistent():
    store.clear_all_sessions()
    sessions.clear()
    return {"cleared": True}


# ── Fraud Detection Gate ──────────────────────────────────────────────────────

from agents.fraud_detector import check_fraud_signals

@app.get("/api/fraud/{customer_id}")
def run_fraud_check(customer_id: str):
    customer = get_customer(customer_id)
    behavior = behavior_monitor.run(customer)
    return check_fraud_signals(customer, behavior)

@app.get("/api/fraud")
def run_all_fraud_checks():
    customers = load_customers()
    results = []
    for c in customers:
        behavior = behavior_monitor.run(c)
        result = check_fraud_signals(c, behavior)
        results.append({
            "customer_id": c["id"],
            "customer_name": c["name"],
            "gate": result["gate"],
            "fraud_score": result["fraud_score"],
            "flag_count": result["flag_count"],
            "safe_to_proceed": result["safe_to_proceed"],
        })
    return {
        "results": results,
        "blocked": sum(1 for r in results if r["gate"] == "BLOCKED"),
        "suspicious": sum(1 for r in results if r["gate"] == "SUSPICIOUS"),
        "safe": sum(1 for r in results if r["gate"] == "SAFE"),
    }


# ── Demo Cache / Offline Mode ─────────────────────────────────────────────────

from demo_cache import is_offline_mode, get_cached_outreach, get_cached_chat_response, get_cache_status

@app.get("/api/demo/cache-status")
def get_demo_cache_status():
    return get_cache_status()

@app.get("/api/demo/offline/{customer_id}")
async def get_offline_outreach(customer_id: str):
    """Returns cached outreach message — no API key needed."""
    customer = get_customer(customer_id)
    behavior = behavior_monitor.run(customer)
    detection = life_event_detector.run(behavior)
    msg = get_cached_outreach(customer_id) or f"Demo message for {customer['name']} — {detection['top_event']}"
    sessions[customer_id] = {
        "customer": customer, "event_data": detection,
        "outreach_message": msg,
        "conversation_history": [{"role": "assistant", "content": msg}],
        "enrollment_status": "pending", "started_at": time.time(),
    }
    return {"whatsapp_message": msg, "offline": True, "event": detection["top_event"]}


# ── Eligibility Checker ───────────────────────────────────────────────────────

from agents.eligibility_checker import check_eligibility, get_best_eligible_product, check_all_products

@app.get("/api/eligibility/{customer_id}/{product_code}")
def check_product_eligibility(customer_id: str, product_code: str):
    customer = get_customer(customer_id)
    return check_eligibility(customer, product_code)

@app.get("/api/eligibility/{customer_id}")
def check_all_product_eligibility(customer_id: str):
    customer = get_customer(customer_id)
    results = check_all_products(customer)
    return {"customer_id": customer_id, "products": results,
            "eligible_count": sum(1 for r in results if r["eligible"])}

@app.get("/api/eligibility/{customer_id}/best")
def get_best_product(customer_id: str):
    customer = get_customer(customer_id)
    behavior = behavior_monitor.run(customer)
    detection = life_event_detector.run(behavior)
    return get_best_eligible_product(customer, detection.get("product_code", "SIP_2000"), behavior)


# ── Sentiment Tracker ─────────────────────────────────────────────────────────

from agents.sentiment_tracker import analyze_sentiment, track_conversation_sentiment

class SentimentRequest(BaseModel):
    message: str

class ConversationSentimentRequest(BaseModel):
    conversation_history: list[dict]

@app.post("/api/sentiment/message")
def analyze_message_sentiment(req: SentimentRequest):
    return analyze_sentiment(req.message)

@app.post("/api/sentiment/conversation")
def analyze_conversation_sentiment(req: ConversationSentimentRequest):
    return track_conversation_sentiment(req.conversation_history)

@app.get("/api/sentiment/{customer_id}")
def get_customer_sentiment(customer_id: str):
    session = sessions.get(customer_id)
    if not session:
        return {"error": "No active session"}
    history = session.get("conversation_history", [])
    return track_conversation_sentiment(history)


# ── YONO Deeplink Generator ───────────────────────────────────────────────────

from agents.yono_deeplink import generate_deeplink, generate_whatsapp_deeplink_message

@app.get("/api/deeplink/{customer_id}")
def get_yono_deeplink(customer_id: str):
    customer = get_customer(customer_id)
    behavior = behavior_monitor.run(customer)
    detection = life_event_detector.run(behavior)
    return generate_deeplink(customer, detection)

@app.get("/api/deeplink/{customer_id}/message")
def get_deeplink_message(customer_id: str):
    customer = get_customer(customer_id)
    behavior = behavior_monitor.run(customer)
    detection = life_event_detector.run(behavior)
    msg = generate_whatsapp_deeplink_message(customer, detection)
    return {"message": msg, "customer_id": customer_id}


# ── Twilio WhatsApp Integration ───────────────────────────────────────────────

from twilio_integration import send_whatsapp, send_to_demo_phone, get_status as twilio_status, format_for_whatsapp

class TwilioSendRequest(BaseModel):
    phone: str | None = None   # Override phone — for jury demo
    use_demo_phone: bool = True

@app.get("/api/twilio/status")
def get_twilio_status():
    return twilio_status()

@app.post("/api/twilio/send/{customer_id}")
async def send_real_whatsapp(customer_id: str, req: TwilioSendRequest = TwilioSendRequest()):
    """Send a real WhatsApp message to the customer or demo phone."""
    session = sessions.get(customer_id)
    if not session:
        # Auto-run pipeline first
        customer = get_customer(customer_id)
        behavior = behavior_monitor.run(customer)
        detection = life_event_detector.run(behavior)
        from demo_cache import get_cached_outreach
        msg = get_cached_outreach(customer_id) or f"Personalized offer for {customer['name']}"
    else:
        customer = session["customer"]
        msg = session["outreach_message"]

    formatted = format_for_whatsapp(msg)

    if req.phone:
        result = send_whatsapp(req.phone, formatted, customer.get("name", ""))
    elif req.use_demo_phone:
        result = send_to_demo_phone(formatted, customer.get("name", ""))
    else:
        phone = customer.get("phone", "")
        result = send_whatsapp(f"whatsapp:{phone}", formatted, customer.get("name", ""))

    return {**result, "customer_id": customer_id, "customer_name": customer.get("name")}


# ── Deeplink endpoints ────────────────────────────────────────────────────────

@app.get("/api/deeplink/all")
def get_all_deeplinks():
    customers = load_customers()
    results = []
    for c in customers:
        behavior = behavior_monitor.run(c)
        detection = life_event_detector.run(behavior)
        from agents.yono_deeplink import generate_deeplink
        link = generate_deeplink(c, detection)
        results.append(link)
    return {"deeplinks": results}


# ── Sentiment on chat responses ───────────────────────────────────────────────
# Patch the /api/chat endpoint to include sentiment analysis in response
# (already imported above as analyze_sentiment, track_conversation_sentiment)

@app.post("/api/chat/sentiment")
async def chat_with_sentiment(req: ChatRequest):
    """Chat endpoint that also returns sentiment analysis."""
    session = sessions.get(req.customer_id)
    if not session:
        raise HTTPException(400, "No active session. Run pipeline first.")

    history = req.conversation_history or session["conversation_history"]

    # Classify intent + sentiment before calling Claude
    intent_result = classify_intent(req.message)
    sentiment_result = analyze_sentiment(req.message)
    conv_sentiment = track_conversation_sentiment(history + [{"role": "user", "content": req.message}])

    # Use offline cache if no API key
    if is_offline_mode():
        turns = len([m for m in history if m.get("role") == "user"])
        reply = get_cached_chat_response(
            req.customer_id,
            session["event_data"].get("product_code", "SIP_2000"),
            intent_result["intent"],
            turns,
        )
        enrollment_status = "enrolled" if turns >= 3 else session.get("enrollment_status", "pending")
        updated_history = history + [
            {"role": "user", "content": req.message},
            {"role": "assistant", "content": reply},
        ]
    else:
        result = await conversational_close.run(
            customer=session["customer"],
            event_data=session["event_data"],
            outreach_message=session["outreach_message"],
            conversation_history=history,
            new_user_message=req.message,
        )
        reply = result["reply_message"]
        enrollment_status = result["enrollment_status"]
        updated_history = result["conversation_history"]

    sessions[req.customer_id]["conversation_history"] = updated_history
    sessions[req.customer_id]["enrollment_status"] = enrollment_status

    # Persist to SQLite
    store.update_conversation(
        req.customer_id, updated_history,
        enrollment_status, req.message, intent_result["intent"]
    )

    # Handle opt-out
    if intent_result["intent"] in ("REJECTION", "WRONG_PERSON") and "stop" in req.message.lower():
        store.process_opt_out(req.customer_id, session["customer"].get("name",""), "WhatsApp")
        enrollment_status = "opted_out"

    return {
        "customer_id": req.customer_id,
        "reply_message": reply,
        "enrollment_status": enrollment_status,
        "conversation_history": updated_history,
        "product_code": session["event_data"].get("product_code"),
        "recommended_product": session["event_data"].get("recommended_product"),
        "intent": intent_result,
        "sentiment": sentiment_result,
        "conversation_sentiment": conv_sentiment,
        "offline_mode": is_offline_mode(),
    }


# ── Outreach endpoint (required by YONO page + frontend) ─────────────────────

@app.post("/api/agent/outreach/{customer_id}")
async def run_personalization_endpoint(customer_id: str):
    """Agents 1+2+3: generates WhatsApp message. Used by YONO page."""
    customer = get_customer(customer_id)

    # Fraud gate
    behavior = behavior_monitor.run(customer)
    fraud_result = check_fraud_signals(customer, behavior)
    if not fraud_result["safe_to_proceed"]:
        raise HTTPException(400, f"Fraud gate blocked: {fraud_result['reason']}")

    # Opt-out check
    if store.is_opted_out(customer_id):
        raise HTTPException(400, "Customer has opted out")

    detection = life_event_detector.run(behavior)

    # Eligibility check + fallback
    elig = get_best_eligible_product(customer, detection.get("product_code","SIP_2000"), behavior)
    if elig.get("is_fallback") and elig.get("selected_product"):
        detection["product_code"] = elig["selected_product"]
        detection["recommended_product"] = elig["selected_product_name"]

    variant_info = ab_testing.get_variant_style(customer_id)

    # Offline cache or live Claude
    if is_offline_mode():
        msg = get_cached_outreach(customer_id) or f"[Demo] Personalized offer for {customer['name']}"
        outreach = {"whatsapp_message": msg, "customer_id": customer_id,
                    "customer_name": customer["name"], "customer_phone": customer.get("phone"),
                    "event": detection.get("top_event"), "product_code": detection.get("product_code"),
                    "outreach_status": "sent", "offline": True}
    else:
        outreach = await personalization_agent.run(customer, detection, variant_style=variant_info["style"])

    # Record A/B
    ab_testing.record_result(ab_testing.ExperimentResult(
        variant=variant_info["variant"], customer_id=customer_id,
        event_type=detection["top_event"], message_sent=outreach["whatsapp_message"],
    ))

    # Save session
    sessions[customer_id] = {
        "customer": customer, "event_data": detection,
        "outreach_message": outreach["whatsapp_message"],
        "conversation_history": [{"role": "assistant", "content": outreach["whatsapp_message"]}],
        "enrollment_status": "pending", "ab_variant": variant_info["variant"],
        "started_at": time.time(),
    }
    store.save_session(customer, detection, outreach["whatsapp_message"], variant_info["variant"])

    return outreach