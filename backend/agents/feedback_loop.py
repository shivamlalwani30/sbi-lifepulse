"""
Agent 5 — Feedback Loop Agent
Records enrollment outcomes and adjusts confidence thresholds and product
recommendations based on what actually converts. This is what makes LifePulse
a learning system, not just a rule engine.

In production: this would feed into a fine-tuning pipeline or a RAG system
that retrieves successful past conversations as few-shot examples.
"""

import time
from dataclasses import dataclass, field
from typing import Any
from collections import defaultdict


@dataclass
class FeedbackRecord:
    customer_id: str
    customer_name: str
    event_type: str
    product_code: str
    confidence_score: float
    ab_variant: str
    enrolled: bool
    opted_out: bool
    conversation_turns: int
    time_to_decision_seconds: float
    city: str
    age: int
    timestamp: float = field(default_factory=time.time)


# In-memory feedback store
_feedback: list[FeedbackRecord] = []

# Learned adjustments — in production these would persist in a DB
_confidence_adjustments: dict[str, float] = {}
_product_success_rates: dict[str, dict] = defaultdict(lambda: {"enrolled": 0, "total": 0})
_event_success_rates: dict[str, dict] = defaultdict(lambda: {"enrolled": 0, "total": 0})
_city_success_rates: dict[str, dict] = defaultdict(lambda: {"enrolled": 0, "total": 0})


def record_outcome(
    customer: dict[str, Any],
    event_data: dict[str, Any],
    enrollment_status: str,
    conversation_history: list[dict],
    ab_variant: str = "A",
    started_at: float = 0.0,
):
    """Call this when a customer conversation ends (enrolled / opted_out / timed_out)."""
    enrolled = enrollment_status == "enrolled"
    opted_out = enrollment_status == "opted_out"
    event_type = event_data.get("top_event", "unknown")
    product_code = event_data.get("product_code", "unknown")
    confidence = event_data.get("confidence", 0.0)
    city = customer.get("city", "unknown")
    age = customer.get("age", 30)
    turns = len([m for m in conversation_history if m.get("role") == "user"])
    duration = time.time() - started_at if started_at else 0.0

    record = FeedbackRecord(
        customer_id=customer["id"],
        customer_name=customer["name"],
        event_type=event_type,
        product_code=product_code,
        confidence_score=confidence,
        ab_variant=ab_variant,
        enrolled=enrolled,
        opted_out=opted_out,
        conversation_turns=turns,
        time_to_decision_seconds=duration,
        city=city,
        age=age,
    )
    _feedback.append(record)

    # Update success rates
    _product_success_rates[product_code]["total"] += 1
    _event_success_rates[event_type]["total"] += 1
    _city_success_rates[city]["total"] += 1
    if enrolled:
        _product_success_rates[product_code]["enrolled"] += 1
        _event_success_rates[event_type]["enrolled"] += 1
        _city_success_rates[city]["enrolled"] += 1

    _recompute_adjustments()
    return record


def _recompute_adjustments():
    """Adjust confidence thresholds based on what's actually converting."""
    for event, stats in _event_success_rates.items():
        if stats["total"] >= 3:
            rate = stats["enrolled"] / stats["total"]
            # If conversion is high, lower the confidence threshold needed
            # If conversion is low, raise it (be more selective)
            baseline = 0.45
            if rate > 0.6:
                _confidence_adjustments[event] = baseline - 0.05
            elif rate < 0.2:
                _confidence_adjustments[event] = baseline + 0.10
            else:
                _confidence_adjustments[event] = baseline


def get_adjusted_threshold(event_type: str) -> float:
    """Return the learned confidence threshold for an event type."""
    return _confidence_adjustments.get(event_type, 0.45)


def get_insights() -> dict[str, Any]:
    """Return actionable insights from feedback data."""
    if not _feedback:
        return {"message": "No feedback data yet. Complete some enrollments first.", "records": 0}

    total = len(_feedback)
    enrolled = sum(1 for r in _feedback if r.enrolled)
    opted_out = sum(1 for r in _feedback if r.opted_out)
    avg_turns = sum(r.conversation_turns for r in _feedback) / total if total else 0
    avg_time = sum(r.time_to_decision_seconds for r in _feedback) / total if total else 0

    # Product performance
    product_perf = {
        code: {
            "enrolled": s["enrolled"],
            "total": s["total"],
            "conversion_rate": round(s["enrolled"] / s["total"] * 100, 1) if s["total"] else 0,
        }
        for code, s in _product_success_rates.items()
        if s["total"] > 0
    }

    # Event performance
    event_perf = {
        evt: {
            "enrolled": s["enrolled"],
            "total": s["total"],
            "conversion_rate": round(s["enrolled"] / s["total"] * 100, 1) if s["total"] else 0,
            "adjusted_threshold": round(get_adjusted_threshold(evt), 2),
        }
        for evt, s in _event_success_rates.items()
        if s["total"] > 0
    }

    # City performance
    city_perf = {
        city: {
            "conversion_rate": round(s["enrolled"] / s["total"] * 100, 1) if s["total"] else 0,
            "total": s["total"],
        }
        for city, s in _city_success_rates.items()
        if s["total"] > 0
    }

    # Age group analysis
    age_groups: dict[str, dict] = defaultdict(lambda: {"enrolled": 0, "total": 0})
    for r in _feedback:
        bucket = "18-25" if r.age < 26 else "26-35" if r.age < 36 else "36-45" if r.age < 46 else "46+"
        age_groups[bucket]["total"] += 1
        if r.enrolled:
            age_groups[bucket]["enrolled"] += 1

    # Best performing combination
    best_variant = None
    best_variant_rate = 0.0
    variant_stats: dict[str, dict] = defaultdict(lambda: {"enrolled": 0, "total": 0})
    for r in _feedback:
        variant_stats[r.ab_variant]["total"] += 1
        if r.enrolled:
            variant_stats[r.ab_variant]["enrolled"] += 1
    for v, s in variant_stats.items():
        rate = s["enrolled"] / s["total"] if s["total"] else 0
        if rate > best_variant_rate:
            best_variant_rate = rate
            best_variant = v

    # Actionable recommendations
    recommendations = []
    for evt, perf in event_perf.items():
        if perf["conversion_rate"] < 20 and perf["total"] >= 2:
            recommendations.append(f"Low conversion on {evt.replace('_',' ')} ({perf['conversion_rate']}%) — consider raising confidence threshold or tweaking message")
        if perf["conversion_rate"] > 70 and perf["total"] >= 2:
            recommendations.append(f"High conversion on {evt.replace('_',' ')} ({perf['conversion_rate']}%) — increase outreach volume for this event type")

    if avg_turns > 5:
        recommendations.append(f"Average {avg_turns:.1f} turns to close — simplify the enrollment flow")
    if avg_turns <= 2 and enrolled > 0:
        recommendations.append(f"Customers closing in {avg_turns:.1f} turns — excellent friction-free experience")

    return {
        "records": total,
        "summary": {
            "total_conversations": total,
            "enrolled": enrolled,
            "opted_out": opted_out,
            "overall_conversion_rate": round(enrolled / total * 100, 1) if total else 0,
            "avg_conversation_turns": round(avg_turns, 1),
            "avg_time_to_decision_seconds": round(avg_time, 0),
        },
        "product_performance": product_perf,
        "event_performance": event_perf,
        "city_performance": city_perf,
        "age_group_performance": {
            k: {"conversion_rate": round(v["enrolled"] / v["total"] * 100, 1) if v["total"] else 0, "total": v["total"]}
            for k, v in age_groups.items()
        },
        "ab_variant_performance": {
            k: {"conversion_rate": round(v["enrolled"] / v["total"] * 100, 1) if v["total"] else 0, "total": v["total"]}
            for k, v in variant_stats.items()
        },
        "best_ab_variant": best_variant,
        "confidence_adjustments": _confidence_adjustments,
        "recommendations": recommendations,
        "raw_records": [
            {
                "customer_name": r.customer_name,
                "event_type": r.event_type,
                "product_code": r.product_code,
                "enrolled": r.enrolled,
                "turns": r.conversation_turns,
                "variant": r.ab_variant,
                "city": r.city,
                "age": r.age,
            }
            for r in _feedback[-20:]  # Last 20
        ],
    }


def seed_demo_feedback():
    """Pre-seed feedback so the page isn't empty on first load."""
    import random
    random.seed(99)

    demo_data = [
        ("CUST001", "Priya Sharma", "salary_hike", "SIP_2000", 0.95, "B", True, False, 3, 45.0, "Mumbai", 29),
        ("CUST002", "Arjun Mehta", "city_relocation", "CARD_UPGRADE", 0.95, "C", True, False, 2, 32.0, "Bengaluru", 34),
        ("CUST003", "Sunita Devi", "new_emi_detected", "TERM_PLAN", 0.95, "A", False, True, 1, 18.0, "Lucknow", 42),
        ("CUST004", "Rahul Verma", "insurance_gap", "LIFE_PROTECT", 0.95, "C", True, False, 4, 78.0, "Hyderabad", 31),
        ("CUST005", "Kavya Reddy", "marriage_detected", "JOINT_ACC_HOMELOAN", 0.95, "B", True, False, 3, 55.0, "Chennai", 27),
        ("CUST006", "Deepak Nair", "new_baby_detected", "CHILD_PLAN", 0.95, "A", True, False, 5, 120.0, "Kochi", 38),
    ]

    for d in demo_data:
        r = FeedbackRecord(
            customer_id=d[0], customer_name=d[1], event_type=d[2],
            product_code=d[3], confidence_score=d[4], ab_variant=d[5],
            enrolled=d[6], opted_out=d[7], conversation_turns=d[8],
            time_to_decision_seconds=d[9], city=d[10], age=d[11],
        )
        _feedback.append(r)
        _product_success_rates[d[3]]["total"] += 1
        _event_success_rates[d[2]]["total"] += 1
        _city_success_rates[d[10]]["total"] += 1
        if d[6]:
            _product_success_rates[d[3]]["enrolled"] += 1
            _event_success_rates[d[2]]["enrolled"] += 1
            _city_success_rates[d[10]]["enrolled"] += 1

    _recompute_adjustments()
