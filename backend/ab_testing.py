"""
A/B Testing Module
Tests different message styles and tracks which converts better.
In production: use a proper experiment framework with statistical significance testing.
For the demo: shows SBI jury that LifePulse is data-driven, not just rule-based.
"""

import random
import time
from dataclasses import dataclass, field
from typing import Any

# Message variants to test
VARIANTS = {
    "A": {
        "name": "Formal Hindi-English",
        "style": "formal, respectful, uses 'aap', mentions SBI brand prominently",
        "example": "Namaste {name} ji! SBI LifePulse mein aapka swagat hai. Aapki income mein vriddhi hui hai...",
    },
    "B": {
        "name": "Casual Hinglish",
        "style": "friendly, casual, uses first name, conversational tone like a friend",
        "example": "Hey {name}! Noticed your salary has been growing — that's awesome! Ready to make it work harder?",
    },
    "C": {
        "name": "Data-forward",
        "style": "leads with specific numbers and facts, then recommendation",
        "example": "{name}, your income grew ₹20K/month over 3 months. A ₹2,000 SIP today = ₹85L at 60. Want to start?",
    },
}


@dataclass
class ExperimentResult:
    variant: str
    customer_id: str
    event_type: str
    message_sent: str
    response_received: str = ""
    converted: bool = False
    response_time_seconds: float = 0.0
    timestamp: float = field(default_factory=time.time)


# In-memory experiment store
_experiments: dict[str, list[ExperimentResult]] = {v: [] for v in VARIANTS}
_customer_variant_map: dict[str, str] = {}


def assign_variant(customer_id: str) -> str:
    """Assign a variant to a customer. Consistent per customer (same customer always gets same variant)."""
    if customer_id not in _customer_variant_map:
        # Deterministic assignment based on customer_id hash
        idx = hash(customer_id) % len(VARIANTS)
        _customer_variant_map[customer_id] = list(VARIANTS.keys())[idx]
    return _customer_variant_map[customer_id]


def get_variant_style(customer_id: str) -> dict[str, str]:
    variant_key = assign_variant(customer_id)
    return {"variant": variant_key, **VARIANTS[variant_key]}


def record_result(result: ExperimentResult):
    _experiments[result.variant].append(result)


def record_conversion(customer_id: str, converted: bool, response_time: float = 0.0):
    variant = _customer_variant_map.get(customer_id)
    if not variant:
        return
    for result in _experiments.get(variant, []):
        if result.customer_id == customer_id and not result.response_received:
            result.converted = converted
            result.response_time_seconds = response_time
            return


def get_stats() -> dict[str, Any]:
    stats = {}
    for variant_key, results in _experiments.items():
        total = len(results)
        converted = sum(1 for r in results if r.converted)
        avg_response_time = (
            sum(r.response_time_seconds for r in results if r.response_time_seconds > 0) /
            max(sum(1 for r in results if r.response_time_seconds > 0), 1)
        )
        stats[variant_key] = {
            "variant": variant_key,
            "name": VARIANTS[variant_key]["name"],
            "style": VARIANTS[variant_key]["style"],
            "total_sent": total,
            "conversions": converted,
            "conversion_rate": round((converted / total * 100), 1) if total else 0,
            "avg_response_time_s": round(avg_response_time, 1),
        }

    # Determine winner
    if any(s["total_sent"] > 0 for s in stats.values()):
        winner = max(stats.values(), key=lambda x: x["conversion_rate"])
        stats["_winner"] = winner["variant"]
    else:
        stats["_winner"] = None

    return stats


def seed_demo_data():
    """Pre-seed some A/B data so the demo looks non-empty on first load."""
    import random
    random.seed(42)

    demo_customers = [
        ("CUST001", "salary_hike"), ("CUST002", "city_relocation"),
        ("CUST003", "new_emi_detected"), ("CUST004", "insurance_gap"),
        ("CUST005", "marriage_detected"), ("CUST006", "new_baby_detected"),
    ]

    extra_ids = [f"DEMO{i:03d}" for i in range(1, 25)]

    all_entries = [(cid, evt) for cid, evt in demo_customers] + [
        (eid, random.choice(["salary_hike", "insurance_gap", "city_relocation"])) for eid in extra_ids
    ]

    for cid, evt in all_entries:
        variant = assign_variant(cid)
        # Simulate varying conversion rates per variant: B > C > A
        conv_rates = {"A": 0.38, "B": 0.61, "C": 0.52}
        converted = random.random() < conv_rates[variant]
        result = ExperimentResult(
            variant=variant,
            customer_id=cid,
            event_type=evt,
            message_sent=f"[Seeded message for {cid}]",
            response_received="YES" if converted else "no thanks",
            converted=converted,
            response_time_seconds=random.uniform(30, 300),
        )
        record_result(result)
