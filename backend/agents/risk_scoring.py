"""
Risk & Opportunity Scoring Engine
Runs alongside life event detection to flag:
1. Churn Risk — customers likely to leave SBI
2. Upsell Readiness — customers ready for premium products
3. Credit Opportunity — customers who qualify for new credit products
4. Dormancy Risk — accounts going inactive

These scores give the sales team a prioritization layer on top of life events.
In production: feed into a CRM priority queue.
"""

from typing import Any


def score_customer(customer: dict[str, Any], behavior_signals: dict[str, Any]) -> dict[str, Any]:
    signals = behavior_signals.get("signals", {})
    balances = customer.get("account_balance_history", [])
    profile = customer.get("profile", {})
    transactions = customer.get("transactions", [])
    existing_products = profile.get("existing_products", [])
    credit_score = profile.get("credit_score", 650)
    age = customer.get("age", 35)

    # ── Churn Risk Score ──────────────────────────────────────────────────────
    churn_score = 0.0

    # Balance declining
    if len(balances) >= 2:
        if balances[-1]["balance"] < balances[0]["balance"] * 0.7:
            churn_score += 0.35  # >30% balance drop = high churn signal
        elif balances[-1]["balance"] < balances[0]["balance"] * 0.9:
            churn_score += 0.15

    # Location change without product update = possible bank switch
    if signals.get("location_change_detected") and len(existing_products) <= 2:
        churn_score += 0.20

    # New EMI at another bank
    emi_merchant = signals.get("emi_merchant", "") or ""
    if signals.get("emi_detected") and "hdfc" in emi_merchant.lower():
        churn_score += 0.20
    if signals.get("emi_detected") and "icici" in emi_merchant.lower():
        churn_score += 0.20

    # Few SBI products = low stickiness
    if len(existing_products) <= 1:
        churn_score += 0.15

    # No insurance from SBI = revenue elsewhere
    if not signals.get("insurance_premium_found"):
        churn_score += 0.10

    churn_score = min(churn_score, 0.99)

    # ── Upsell Readiness Score ────────────────────────────────────────────────
    upsell_score = 0.0

    avg_balance = signals.get("avg_monthly_balance", 0)
    salary_hist = signals.get("salary_history", {})
    avg_salary = sum(salary_hist.values()) / len(salary_hist) if salary_hist else 0

    if avg_balance > 100000:
        upsell_score += 0.30
    elif avg_balance > 50000:
        upsell_score += 0.15

    if avg_salary > 80000:
        upsell_score += 0.25
    elif avg_salary > 50000:
        upsell_score += 0.15

    if signals.get("salary_trend_direction") == "increasing":
        upsell_score += 0.20

    if credit_score >= 750:
        upsell_score += 0.20
    elif credit_score >= 700:
        upsell_score += 0.10

    if len(existing_products) >= 3:
        upsell_score += 0.10  # Already engaged customer

    upsell_score = min(upsell_score, 0.99)

    # ── Credit Opportunity Score ──────────────────────────────────────────────
    credit_opp_score = 0.0

    if credit_score >= 750 and avg_salary > 50000:
        credit_opp_score += 0.50
    elif credit_score >= 700 and avg_salary > 30000:
        credit_opp_score += 0.30

    if not any("credit card" in p.lower() or "loan" in p.lower() for p in existing_products):
        credit_opp_score += 0.30  # No credit product yet

    if signals.get("salary_trend_direction") == "increasing":
        credit_opp_score += 0.15

    if 25 <= age <= 45:
        credit_opp_score += 0.10  # Prime credit age

    credit_opp_score = min(credit_opp_score, 0.99)

    # ── Dormancy Risk Score ───────────────────────────────────────────────────
    dormancy_score = 0.0

    # Low transaction count in recent months
    recent_txn_count = len([t for t in transactions if t.get("date", "").startswith("2024-12")])
    if recent_txn_count <= 2:
        dormancy_score += 0.40
    elif recent_txn_count <= 4:
        dormancy_score += 0.20

    # Balance flat or declining
    if signals.get("balance_trend") == "declining":
        dormancy_score += 0.30
    elif signals.get("balance_trend") == "stable":
        dormancy_score += 0.10

    # No digital transactions (no UPI)
    upi_txns = [t for t in transactions if "UPI" in t.get("description", "")]
    if len(upi_txns) < 2:
        dormancy_score += 0.20

    dormancy_score = min(dormancy_score, 0.99)

    # ── Risk Level Labels ─────────────────────────────────────────────────────
    def level(score):
        if score >= 0.65:
            return "high"
        elif score >= 0.35:
            return "medium"
        else:
            return "low"

    def opp_level(score):
        if score >= 0.65:
            return "hot"
        elif score >= 0.35:
            return "warm"
        else:
            return "cold"

    # ── Action Recommendations ────────────────────────────────────────────────
    actions = []

    if churn_score >= 0.55:
        actions.append({
            "priority": "URGENT",
            "action": "Retention outreach",
            "message": "High churn risk detected — trigger retention call or exclusive SBI offer",
            "channel": "Phone + WhatsApp",
        })
    if upsell_score >= 0.65:
        actions.append({
            "priority": "HIGH",
            "action": "Premium product offer",
            "message": "Customer is ready for SBI Wealth Management or Premium Credit Card",
            "channel": "WhatsApp + YONO push",
        })
    if credit_opp_score >= 0.60:
        actions.append({
            "priority": "MEDIUM",
            "action": "Credit product pitch",
            "message": "Pre-approved for SBI SimplyCLICK or Personal Loan — no documents needed",
            "channel": "WhatsApp",
        })
    if dormancy_score >= 0.50:
        actions.append({
            "priority": "MEDIUM",
            "action": "Re-engagement campaign",
            "message": "Account going dormant — trigger savings interest rate offer or FD nudge",
            "channel": "SMS + YONO",
        })

    return {
        "customer_id": customer["id"],
        "customer_name": customer["name"],
        "scores": {
            "churn_risk": round(churn_score, 2),
            "upsell_readiness": round(upsell_score, 2),
            "credit_opportunity": round(credit_opp_score, 2),
            "dormancy_risk": round(dormancy_score, 2),
        },
        "levels": {
            "churn_risk": level(churn_score),
            "upsell_readiness": opp_level(upsell_score),
            "credit_opportunity": opp_level(credit_opp_score),
            "dormancy_risk": level(dormancy_score),
        },
        "overall_priority": (
            "urgent" if churn_score >= 0.65 else
            "high" if upsell_score >= 0.65 or credit_opp_score >= 0.65 else
            "medium" if any(s >= 0.35 for s in [churn_score, upsell_score, credit_opp_score]) else
            "low"
        ),
        "recommended_actions": actions,
        "profile_summary": {
            "age": age,
            "credit_score": credit_score,
            "existing_products": len(existing_products),
            "avg_monthly_balance": round(avg_balance),
            "avg_monthly_salary": round(avg_salary),
        },
    }


def score_all_customers(customers: list[dict], behavior_results: list[dict]) -> list[dict]:
    """Score a batch of customers. Returns sorted by priority."""
    results = [
        score_customer(c, b)
        for c, b in zip(customers, behavior_results)
    ]
    priority_order = {"urgent": 0, "high": 1, "medium": 2, "low": 3}
    return sorted(results, key=lambda r: priority_order.get(r["overall_priority"], 4))
