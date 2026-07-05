"""
Scale Metrics Module
Calculates the business impact of LifePulse at SBI scale.
These numbers are what make the jury say "this is a ₹2.5L idea."
"""

# SBI real statistics (public data, FY2024)
SBI_STATS = {
    "total_customers": 500_000_000,       # 500M customers
    "yono_users": 80_000_000,             # 80M YONO users
    "monthly_active_digital": 45_000_000, # 45M MAU digital
    "avg_products_per_customer": 1.3,     # vs global best 4.2
    "annual_revenue_cr": 200_000,         # ₹2L crore revenue (FY2024)
    "net_profit_cr": 61_077,              # ₹61K crore net profit
    "branch_cost_per_interaction": 250,   # ₹250 per branch visit
    "digital_cost_per_interaction": 2,    # ₹2 per digital interaction
    "avg_product_revenue_per_customer_yr": 4200,  # ₹4200/yr per product
}

# LifePulse assumptions (conservative)
LIFEPULSE_ASSUMPTIONS = {
    "pct_customers_with_detectable_event": 0.15,  # 15% have a life event in any 90-day window
    "outreach_conversion_rate": 0.08,             # 8% convert from WhatsApp nudge (vs 1.2% cold)
    "avg_new_products_per_enrolled": 1.0,
    "cost_per_agent_run": 0.02,                   # ₹0.02 per customer pipeline run (Claude API cost)
    "rollout_phase_1_pct": 0.02,                  # Phase 1: 2% of customers (YONO users)
}


def calculate_impact(
    customer_base: int = SBI_STATS["total_customers"],
    conversion_rate: float = LIFEPULSE_ASSUMPTIONS["outreach_conversion_rate"],
    event_detection_rate: float = LIFEPULSE_ASSUMPTIONS["pct_customers_with_detectable_event"],
    avg_product_revenue: int = SBI_STATS["avg_product_revenue_per_customer_yr"],
    cost_per_run: float = LIFEPULSE_ASSUMPTIONS["cost_per_agent_run"],
) -> dict:

    # Funnel
    customers_with_events = int(customer_base * event_detection_rate)
    outreach_sent = customers_with_events
    enrolled = int(outreach_sent * conversion_rate)

    # Revenue
    annual_revenue_uplift = enrolled * avg_product_revenue
    three_year_revenue = annual_revenue_uplift * 3

    # Cost savings (digital vs branch)
    branch_cost_saved = outreach_sent * (
        SBI_STATS["branch_cost_per_interaction"] - SBI_STATS["digital_cost_per_interaction"]
    )

    # Operating cost
    total_api_cost = customer_base * cost_per_run
    net_benefit_yr1 = annual_revenue_uplift + branch_cost_saved - total_api_cost

    # Phase 1 (YONO users only)
    phase1_base = SBI_STATS["yono_users"]
    phase1_events = int(phase1_base * event_detection_rate)
    phase1_enrolled = int(phase1_events * conversion_rate)
    phase1_revenue = phase1_enrolled * avg_product_revenue

    return {
        "input": {
            "customer_base": customer_base,
            "conversion_rate_pct": round(conversion_rate * 100, 1),
            "event_detection_rate_pct": round(event_detection_rate * 100, 1),
        },
        "funnel": {
            "total_customers": customer_base,
            "customers_with_detectable_event": customers_with_events,
            "outreach_messages_sent": outreach_sent,
            "customers_enrolled": enrolled,
            "drop_off": outreach_sent - enrolled,
        },
        "revenue": {
            "annual_uplift_cr": round(annual_revenue_uplift / 10_000_000, 1),
            "three_year_cr": round(three_year_revenue / 10_000_000, 1),
            "branch_cost_saved_cr": round(branch_cost_saved / 10_000_000, 1),
            "total_api_cost_cr": round(total_api_cost / 10_000_000, 2),
            "net_benefit_yr1_cr": round(net_benefit_yr1 / 10_000_000, 1),
        },
        "phase1_yono": {
            "base_users": phase1_base,
            "events_detected": phase1_events,
            "enrolled": phase1_enrolled,
            "revenue_cr": round(phase1_revenue / 10_000_000, 1),
            "timeline": "0–6 months",
        },
        "unit_economics": {
            "cost_per_customer_per_year_rs": round(cost_per_run * 12, 2),
            "revenue_per_enrolled_customer_rs": avg_product_revenue,
            "roi_multiple": round(avg_product_revenue / (cost_per_run * 12), 0),
            "payback_days": round((cost_per_run * 12) / (avg_product_revenue / 365), 1),
        },
        "vs_current_state": {
            "current_products_per_customer": SBI_STATS["avg_products_per_customer"],
            "global_best_products_per_customer": 4.2,
            "lifepulse_products_per_customer_yr1": round(
                SBI_STATS["avg_products_per_customer"] + (enrolled / customer_base), 2
            ),
            "gap_to_global_best": round(4.2 - SBI_STATS["avg_products_per_customer"], 1),
        },
        "operational": {
            "messages_per_second_needed": round(outreach_sent / (30 * 24 * 3600), 2),
            "peak_concurrent_pipelines": 1000,
            "avg_pipeline_duration_seconds": 8,
            "infrastructure": "Kubernetes horizontal scaling, 3 replicas minimum",
        },
    }
