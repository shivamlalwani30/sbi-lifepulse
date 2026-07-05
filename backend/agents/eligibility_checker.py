"""
Product Eligibility Pre-Check
Validates that a customer actually qualifies for a product BEFORE
the personalization agent generates an offer. A rejection after
enrollment = terrible UX and a jury red flag.

Runs between Agent 2 (detection) and Agent 3 (personalization).
If customer doesn't qualify for detected product, falls back to
the next best eligible product.
"""

from typing import Any

# Eligibility rules per product code
ELIGIBILITY_RULES: dict[str, dict] = {
    "SIP_2000": {
        "name": "SBI Mutual Fund SIP",
        "min_age": 18,
        "max_age": 70,
        "min_monthly_income": 10000,
        "min_credit_score": 0,       # No credit score needed
        "kyc_required": True,
        "existing_product_required": None,
        "notes": "KYC must be verified. No income upper limit.",
    },
    "CARD_UPGRADE": {
        "name": "SBI Credit Card Upgrade",
        "min_age": 21,
        "max_age": 65,
        "min_monthly_income": 25000,
        "min_credit_score": 700,
        "kyc_required": True,
        "existing_product_required": None,
        "notes": "Credit score is the primary gate. Income must be verifiable.",
    },
    "TERM_PLAN": {
        "name": "SBI Life eShield",
        "min_age": 18,
        "max_age": 65,
        "min_monthly_income": 15000,
        "min_credit_score": 0,
        "kyc_required": True,
        "existing_product_required": None,
        "notes": "Medical underwriting above ₹50L. No income upper limit.",
    },
    "LIFE_PROTECT": {
        "name": "SBI Life Smart Protect",
        "min_age": 18,
        "max_age": 60,
        "min_monthly_income": 20000,
        "min_credit_score": 0,
        "kyc_required": True,
        "existing_product_required": None,
        "notes": "Max entry age is 60. Stricter than term plan.",
    },
    "JOINT_ACC_HOMELOAN": {
        "name": "SBI Joint Account + Home Loan",
        "min_age": 21,
        "max_age": 60,
        "min_monthly_income": 20000,
        "min_credit_score": 680,
        "kyc_required": True,
        "existing_product_required": "Savings Account",
        "notes": "Home loan requires property. Joint account is standalone.",
    },
    "CHILD_PLAN": {
        "name": "SBI Life Smart Champ",
        "min_age": 18,
        "max_age": 55,
        "min_monthly_income": 15000,
        "min_credit_score": 0,
        "kyc_required": True,
        "existing_product_required": None,
        "child_max_age": 13,
        "notes": "Child must be under 13. Parent max age 55.",
    },
    "SAVINGS_OPT": {
        "name": "SBI Savings Plus (Sweep FD)",
        "min_age": 18,
        "max_age": 100,
        "min_monthly_income": 0,
        "min_credit_score": 0,
        "min_balance": 25000,
        "kyc_required": True,
        "existing_product_required": "Savings Account",
        "notes": "Must have existing SBI savings account with min ₹25K.",
    },
    "HOME_LOAN_TOPUP": {
        "name": "SBI Home Loan Top-up",
        "min_age": 21,
        "max_age": 60,
        "min_monthly_income": 25000,
        "min_credit_score": 700,
        "kyc_required": True,
        "existing_product_required": "Home Loan",
        "notes": "Must have existing home loan with 12+ months clean repayment.",
    },
}

# Fallback product chain — if primary not eligible, try these in order
FALLBACK_CHAIN: dict[str, list[str]] = {
    "CARD_UPGRADE":       ["SIP_2000", "SAVINGS_OPT"],
    "JOINT_ACC_HOMELOAN": ["SIP_2000", "TERM_PLAN"],
    "HOME_LOAN_TOPUP":    ["TERM_PLAN", "SIP_2000"],
    "LIFE_PROTECT":       ["TERM_PLAN", "SIP_2000"],
    "CHILD_PLAN":         ["SIP_2000", "TERM_PLAN"],
    "TERM_PLAN":          ["SIP_2000", "SAVINGS_OPT"],
    "SIP_2000":           ["SAVINGS_OPT"],
    "SAVINGS_OPT":        [],
}


def check_eligibility(
    customer: dict[str, Any],
    product_code: str,
    behavior_signals: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """
    Check if a customer is eligible for a product.
    Returns eligibility result with specific failure reasons.
    """
    rules = ELIGIBILITY_RULES.get(product_code)
    if not rules:
        return {"eligible": True, "product_code": product_code, "reason": "No rules defined — allowing", "failures": []}

    profile = customer.get("profile", {})
    age = customer.get("age", 35)
    credit_score = profile.get("credit_score", 650)
    kyc_status = profile.get("kyc_status", "unknown")
    existing_products = [p.lower() for p in profile.get("existing_products", [])]

    # Get income from transactions
    transactions = customer.get("transactions", [])
    salary_txns = [t for t in transactions if t.get("category") == "salary"]
    avg_monthly_income = (
        sum(abs(t["amount"]) for t in salary_txns) / len(salary_txns)
        if salary_txns else 0
    )

    # Get balance
    balances = customer.get("account_balance_history", [])
    avg_balance = (
        sum(b["balance"] for b in balances) / len(balances)
        if balances else 0
    )

    failures = []

    # Age check
    if age < rules["min_age"]:
        failures.append(f"Age {age} below minimum {rules['min_age']}")
    if age > rules["max_age"]:
        failures.append(f"Age {age} above maximum {rules['max_age']}")

    # Income check
    if avg_monthly_income < rules["min_monthly_income"]:
        failures.append(
            f"Monthly income ₹{avg_monthly_income:,.0f} below minimum ₹{rules['min_monthly_income']:,}"
        )

    # Credit score check
    if rules["min_credit_score"] > 0 and credit_score < rules["min_credit_score"]:
        failures.append(
            f"Credit score {credit_score} below minimum {rules['min_credit_score']}"
        )

    # KYC check
    if rules["kyc_required"] and kyc_status != "verified":
        failures.append(f"KYC not verified (status: {kyc_status})")

    # Existing product check
    req_product = rules.get("existing_product_required")
    if req_product:
        if not any(req_product.lower() in p for p in existing_products):
            failures.append(f"Requires existing '{req_product}' — not found")

    # Balance check (for savings products)
    min_balance = rules.get("min_balance", 0)
    if min_balance > 0 and avg_balance < min_balance:
        failures.append(f"Average balance ₹{avg_balance:,.0f} below minimum ₹{min_balance:,}")

    eligible = len(failures) == 0

    return {
        "eligible": eligible,
        "product_code": product_code,
        "product_name": rules["name"],
        "failures": failures,
        "reason": "All criteria met" if eligible else f"{len(failures)} eligibility criteria not met",
        "notes": rules.get("notes", ""),
        "customer_profile": {
            "age": age,
            "credit_score": credit_score,
            "avg_monthly_income": round(avg_monthly_income),
            "kyc_status": kyc_status,
            "existing_products_count": len(existing_products),
            "avg_balance": round(avg_balance),
        },
    }


def get_best_eligible_product(
    customer: dict[str, Any],
    primary_product_code: str,
    behavior_signals: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """
    Check primary product eligibility. If not eligible,
    walk the fallback chain to find the best eligible product.
    """
    # Check primary first
    primary_result = check_eligibility(customer, primary_product_code, behavior_signals)

    if primary_result["eligible"]:
        return {
            "selected_product": primary_product_code,
            "selected_product_name": primary_result["product_name"],
            "is_fallback": False,
            "original_product": primary_product_code,
            "eligibility_check": primary_result,
            "fallbacks_tried": [],
        }

    # Try fallbacks
    fallbacks = FALLBACK_CHAIN.get(primary_product_code, [])
    fallbacks_tried = [{"product": primary_product_code, "reason": primary_result["failures"]}]

    for fallback_code in fallbacks:
        result = check_eligibility(customer, fallback_code, behavior_signals)
        if result["eligible"]:
            return {
                "selected_product": fallback_code,
                "selected_product_name": result["product_name"],
                "is_fallback": True,
                "original_product": primary_product_code,
                "eligibility_check": result,
                "fallbacks_tried": fallbacks_tried,
            }
        fallbacks_tried.append({"product": fallback_code, "reason": result["failures"]})

    # Nothing eligible — offer basic savings optimization
    basic = check_eligibility(customer, "SIP_2000")
    return {
        "selected_product": "SIP_2000" if basic["eligible"] else None,
        "selected_product_name": "SBI Mutual Fund SIP" if basic["eligible"] else None,
        "is_fallback": True,
        "original_product": primary_product_code,
        "eligibility_check": basic,
        "fallbacks_tried": fallbacks_tried,
        "no_product_available": not basic["eligible"],
    }


def check_all_products(customer: dict[str, Any]) -> list[dict[str, Any]]:
    """Check eligibility for all products — for the 360 profile page."""
    results = []
    for code, rules in ELIGIBILITY_RULES.items():
        result = check_eligibility(customer, code)
        results.append({
            "product_code": code,
            "product_name": rules["name"],
            "eligible": result["eligible"],
            "failures": result["failures"],
        })
    return sorted(results, key=lambda r: (not r["eligible"], r["product_name"]))
