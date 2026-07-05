"""
Customer Lifetime Value (CLV) Calculator
Shows SBI the long-term financial value of each enrolled customer.
This is the business case that justifies the ₹0.02/customer API cost.

Formula:
CLV = (Average Revenue Per Product × Avg Products Held × Retention Rate^Years) 
      + Cross-sell Revenue
      - Acquisition/Servicing Cost

Inputs are based on SBI FY2024 public data and industry benchmarks.
"""

from typing import Any

# SBI product revenue benchmarks (annual, INR)
PRODUCT_REVENUE = {
    "savings_account":    1200,   # Net interest margin on avg balance
    "credit_card":        4800,   # Annual fees + interchange + interest
    "home_loan":         18000,   # Net interest margin
    "personal_loan":      8400,   # Net interest margin
    "sip_mutual_fund":    1800,   # Distribution commission (~0.75% on ₹24K annual)
    "term_insurance":     2400,   # Commission on premium
    "health_insurance":   1800,   # Commission
    "fixed_deposit":      3600,   # Net spread
    "ppf_account":         600,   # Administration fee
    "demat_account":      1200,   # Annual charges + brokerage
    "car_loan":           9600,   # Net interest margin
    "education_loan":     7200,   # Net interest margin
}

# Average products per event type (what customers typically buy after enrollment)
EVENT_CROSS_SELL = {
    "salary_hike":        ["sip_mutual_fund", "credit_card"],
    "city_relocation":    ["credit_card", "personal_loan"],
    "new_emi_detected":   ["term_insurance", "health_insurance"],
    "insurance_gap":      ["term_insurance", "health_insurance"],
    "marriage_detected":  ["savings_account", "home_loan", "credit_card"],
    "new_baby_detected":  ["term_insurance", "sip_mutual_fund", "health_insurance"],
    "no_event":           ["fixed_deposit"],
}

# Retention rates by segment
RETENTION_RATES = {
    "premium":   0.94,   # Credit score 750+ or salary > ₹1L/month
    "standard":  0.88,   # Average customer
    "at_risk":   0.72,   # Low engagement or churn signals
}

def calculate_clv(
    customer: dict[str, Any],
    event_type: str,
    years: int = 5,
) -> dict[str, Any]:
    """Calculate CLV for a customer post-enrollment."""

    age = customer.get("age", 35)
    profile = customer.get("profile", {})
    credit_score = profile.get("credit_score", 680)
    existing_products = profile.get("existing_products", [])
    balances = customer.get("account_balance_history", [])
    avg_balance = sum(b["balance"] for b in balances) / len(balances) if balances else 50000

    # Salary from transactions
    salary_txns = [t for t in customer.get("transactions", []) if t.get("category") == "salary"]
    avg_salary = sum(abs(t["amount"]) for t in salary_txns) / len(salary_txns) if salary_txns else 50000

    # Determine segment
    if credit_score >= 750 or avg_salary >= 100000:
        segment = "premium"
    elif credit_score >= 680 or avg_salary >= 40000:
        segment = "standard"
    else:
        segment = "at_risk"

    retention_rate = RETENTION_RATES[segment]

    # Current annual revenue (existing products)
    current_revenue = 0
    for prod in existing_products:
        prod_lower = prod.lower()
        for key, rev in PRODUCT_REVENUE.items():
            if key.replace("_", " ") in prod_lower or key.split("_")[0] in prod_lower:
                current_revenue += rev
                break
    if current_revenue == 0:
        current_revenue = PRODUCT_REVENUE["savings_account"]

    # New products from enrollment
    new_products = EVENT_CROSS_SELL.get(event_type, ["savings_account"])
    new_revenue = sum(PRODUCT_REVENUE.get(p, 1800) for p in new_products)

    total_annual_revenue = current_revenue + new_revenue

    # CLV calculation over N years with retention decay
    clv = 0
    yearly_breakdown = []
    for year in range(1, years + 1):
        year_retention = retention_rate ** year
        year_revenue = total_annual_revenue * year_retention
        # Add salary-based balance growth assumption (3% p.a.)
        balance_bonus = avg_balance * 0.003 * year * year_retention
        year_total = year_revenue + balance_bonus
        clv += year_total
        yearly_breakdown.append({
            "year": year,
            "revenue": round(year_total),
            "retention_probability": round(year_retention * 100, 1),
        })

    # Acquisition cost via LifePulse
    lifepulse_cost = 0.02 * 12  # ₹0.24/year pipeline cost
    traditional_cost = 1500     # Branch acquisition cost

    # Remaining banking lifetime (assume retire at 60)
    years_left = max(0, 60 - age)
    lifetime_clv = clv * (years_left / years) if years > 0 else clv

    return {
        "customer_id": customer["id"],
        "customer_name": customer["name"],
        "segment": segment,
        "event_type": event_type,
        "clv_5_year": round(clv),
        "clv_lifetime": round(lifetime_clv),
        "annual_revenue_before": round(current_revenue),
        "annual_revenue_after": round(total_annual_revenue),
        "revenue_uplift_annual": round(new_revenue),
        "new_products_triggered": new_products,
        "retention_rate": retention_rate,
        "years_left": years_left,
        "yearly_breakdown": yearly_breakdown,
        "cost_comparison": {
            "lifepulse_acquisition_cost": round(lifepulse_cost, 2),
            "traditional_branch_cost": traditional_cost,
            "savings": round(traditional_cost - lifepulse_cost, 2),
            "roi_multiple": round(clv / lifepulse_cost),
        },
        "profile": {
            "age": age,
            "credit_score": credit_score,
            "avg_monthly_salary": round(avg_salary),
            "avg_balance": round(avg_balance),
            "existing_products_count": len(existing_products),
        },
    }


def calculate_portfolio_clv(
    customers: list[dict],
    event_detections: list[dict],
) -> dict[str, Any]:
    """Calculate CLV across all enrolled customers — portfolio view."""
    results = []
    for customer, detection in zip(customers, event_detections):
        clv = calculate_clv(customer, detection.get("top_event", "no_event"))
        results.append(clv)

    total_5yr = sum(r["clv_5_year"] for r in results)
    total_lifetime = sum(r["clv_lifetime"] for r in results)
    avg_5yr = total_5yr // len(results) if results else 0
    total_cost = sum(r["cost_comparison"]["lifepulse_acquisition_cost"] for r in results)
    total_roi = round(total_5yr / total_cost) if total_cost > 0 else 0

    segment_breakdown = {}
    for r in results:
        seg = r["segment"]
        if seg not in segment_breakdown:
            segment_breakdown[seg] = {"count": 0, "total_clv": 0}
        segment_breakdown[seg]["count"] += 1
        segment_breakdown[seg]["total_clv"] += r["clv_5_year"]

    return {
        "portfolio_summary": {
            "total_customers": len(results),
            "total_clv_5yr": round(total_5yr),
            "total_clv_lifetime": round(total_lifetime),
            "avg_clv_5yr_per_customer": round(avg_5yr),
            "total_acquisition_cost": round(total_cost, 2),
            "portfolio_roi": total_roi,
        },
        "segment_breakdown": segment_breakdown,
        "individual_clvs": results,
        "scale_projection": {
            "enrolled_at_sbi_scale": 6_000_000,
            "projected_5yr_clv_cr": round(avg_5yr * 6_000_000 / 10_000_000),
            "note": "At 8% conversion on 75M detectable events",
        },
    }
