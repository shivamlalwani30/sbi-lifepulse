"""
SBI Product Catalog
Real SBI products with eligibility rules, pricing, and offer parameters.
Used by the Personalization Agent to generate accurate, product-specific offers.
"""

from typing import Any

PRODUCTS = {
    "SIP_2000": {
        "name": "SBI Mutual Fund SIP",
        "category": "investment",
        "min_amount": 500,
        "suggested_amounts": [500, 1000, 2000, 5000, 10000],
        "min_tenure_months": 6,
        "description": "Monthly SIP into SBI Bluechip Fund or SBI Flexicap",
        "benefits": ["Tax saving under 80C (ELSS)", "Rupee cost averaging", "No exit load after 1 year"],
        "eligibility": {"min_age": 18, "min_monthly_income": 15000, "kyc_required": True},
        "triggers": ["salary_hike", "no_event"],
        "url_deeplink": "yono://sip/start",
        "est_returns": "12-15% CAGR (historical)",
    },
    "CARD_UPGRADE": {
        "name": "SBI Credit Card Upgrade",
        "category": "credit",
        "variants": ["SBI SimplyCLICK", "SBI Prime", "SBI Elite"],
        "credit_limits": [50000, 100000, 200000, 500000],
        "annual_fee": [499, 2999, 4999],
        "description": "Upgrade to a higher-tier SBI credit card with better rewards",
        "benefits": ["Higher credit limit", "Airport lounge access (Prime/Elite)", "5x reward points on online spends"],
        "eligibility": {"min_age": 21, "min_credit_score": 700, "min_monthly_income": 25000},
        "triggers": ["salary_hike", "city_relocation"],
        "url_deeplink": "yono://cards/upgrade",
        "processing_time": "Instant digital approval",
    },
    "TERM_PLAN": {
        "name": "SBI Life eShield Next",
        "category": "insurance",
        "sum_assured_options": [2500000, 5000000, 10000000, 25000000],
        "premium_range": "₹500–₹2,000/month",
        "description": "Pure term life insurance with high coverage at low premium",
        "benefits": ["Death benefit to nominee", "Critical illness rider available", "100% digital — no medicals up to ₹50L"],
        "eligibility": {"min_age": 18, "max_age": 65, "min_sum_assured": 2500000},
        "triggers": ["new_emi_detected", "new_baby_detected", "marriage_detected"],
        "url_deeplink": "yono://insurance/term",
        "claim_settlement_ratio": "94.52% (FY2024)",
    },
    "LIFE_PROTECT": {
        "name": "SBI Life Smart Protect Plan",
        "category": "insurance",
        "coverage_options": [5000000, 10000000, 25000000, 50000000],
        "premium_example": "₹1 crore cover at ₹800/month for 30-year-old",
        "description": "Comprehensive life protection with return of premium option",
        "benefits": ["Life cover + return of premium on maturity", "Waiver of premium on disability", "Tax benefit u/s 80C & 10(10D)"],
        "eligibility": {"min_age": 18, "max_age": 60, "min_monthly_income": 30000},
        "triggers": ["insurance_gap"],
        "url_deeplink": "yono://insurance/smart-protect",
        "claim_settlement_ratio": "94.52% (FY2024)",
    },
    "JOINT_ACC_HOMELOAN": {
        "name": "SBI Joint Account + Home Loan Pre-approval",
        "category": "banking+loan",
        "home_loan_rates": "Starting 8.50% p.a.",
        "max_loan_amount": "Up to ₹10 crore",
        "description": "Open a joint account + get pre-approved home loan offer together",
        "benefits": ["0.05% lower rate for women co-applicants", "No processing fee for first 90 days", "Digital KYC — branch visit optional"],
        "eligibility": {"min_age": 21, "min_monthly_income": 25000, "min_credit_score": 700},
        "triggers": ["marriage_detected"],
        "url_deeplink": "yono://accounts/joint-open",
        "processing_time": "Account open in 10 minutes",
    },
    "CHILD_PLAN": {
        "name": "SBI Life Smart Champ Insurance",
        "category": "insurance+investment",
        "premium_options": [1000, 2000, 5000, 10000],
        "policy_term": "Until child turns 21",
        "description": "Child education + protection plan with guaranteed payouts",
        "benefits": ["Guaranteed payouts at ages 18, 19, 20, 21", "Waiver of premium if parent dies", "Bonus declared annually"],
        "eligibility": {"child_max_age": 13, "parent_min_age": 18, "parent_max_age": 55},
        "triggers": ["new_baby_detected"],
        "url_deeplink": "yono://insurance/child-plan",
        "alternate": "Sukanya Samriddhi Yojana for girl child — 8.2% guaranteed returns",
    },
    "SAVINGS_OPT": {
        "name": "SBI Savings Plus (Sweep-in FD)",
        "category": "savings",
        "min_balance_trigger": 25000,
        "sweep_threshold": 10000,
        "fd_rate": "6.80% p.a.",
        "description": "Idle savings auto-swept to FD, swept back when needed",
        "benefits": ["Higher interest than savings rate", "Fully liquid — no lock-in", "Automatic — no manual action needed"],
        "eligibility": {"min_balance": 25000, "existing_sbi_account": True},
        "triggers": ["no_event"],
        "url_deeplink": "yono://accounts/savings-plus",
    },
    "HOME_LOAN_TOPUP": {
        "name": "SBI Home Loan Top-up",
        "category": "loan",
        "max_topup": "Up to ₹50 lakh or 80% of property value",
        "rate": "8.75% p.a. (same as base home loan)",
        "description": "Additional loan on existing home loan at lower rates than personal loan",
        "benefits": ["Lower rate than personal loan", "Longer tenure up to 15 years", "Tax deductible interest u/s 24"],
        "eligibility": {"existing_home_loan": True, "repayment_track": "12+ months clean"},
        "triggers": ["new_emi_detected"],
        "url_deeplink": "yono://loans/topup",
    },
}


def get_product(product_code: str) -> dict[str, Any]:
    return PRODUCTS.get(product_code, {})


def get_products_for_event(event: str) -> list[dict[str, Any]]:
    return [
        {"code": code, **product}
        for code, product in PRODUCTS.items()
        if event in product.get("triggers", [])
    ]


def get_offer_summary(product_code: str, customer: dict[str, Any]) -> str:
    """Generate a personalized offer line for a customer."""
    product = PRODUCTS.get(product_code, {})
    if not product:
        return "Exclusive SBI offer available"

    name = customer.get("name", "Customer").split()[0]
    age = customer.get("age", 30)
    balances = customer.get("account_balance_history", [{}])
    balance = balances[-1].get("balance", 0) if balances else 0

    summaries = {
        "SIP_2000": f"Start a ₹2,000/month SIP — at your age of {age}, this becomes ₹{round(2000 * 12 * ((1.01**((65-age)*12)-1)/0.01) / 100000):.0f}L by retirement",
        "CARD_UPGRADE": f"Get a higher SBI credit card limit — your income qualifies for up to ₹1 lakh limit",
        "TERM_PLAN": f"₹1 crore life cover for just ~₹800/month — protect your family's future",
        "LIFE_PROTECT": f"₹1 crore Smart Protect Plan — zero insurance detected on your account, fix that today",
        "JOINT_ACC_HOMELOAN": f"Open a joint account + get pre-approved for SBI Home Loan at 8.50% p.a.",
        "CHILD_PLAN": f"Secure your child's education — guaranteed payouts at age 18, 19, 20, 21",
        "SAVINGS_OPT": f"Your ₹{balance//1000}K idle balance can earn 6.80% FD rate automatically",
        "HOME_LOAN_TOPUP": f"Get up to ₹50L top-up on your home loan at the same low rate",
    }
    return summaries.get(product_code, f"Special {product.get('name', 'SBI')} offer for you")
