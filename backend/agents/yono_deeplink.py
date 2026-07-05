"""
YONO Deeplink Generator
Generates pre-filled SBI YONO app deeplinks that open exactly
on the right product screen with customer info pre-populated.

Instead of completing enrollment in WhatsApp chat (4-6 turns),
the customer taps a link → YONO opens → product screen pre-filled
→ one tap to confirm. Friction drops from 5 minutes to 10 seconds.

Format: yono://product/{product_code}?{params}
Web fallback: https://yonobusiness.sbi/{product_code}?{params}
(Demo: shows what the link would look like in production)
"""

import urllib.parse
from typing import Any


def generate_deeplink(
    customer: dict[str, Any],
    event_data: dict[str, Any],
    source: str = "whatsapp_lifepulse",
) -> dict[str, Any]:
    """
    Generate a YONO deeplink for a specific product + customer combination.
    Returns both the native app link and a web fallback.
    """
    product_code = event_data.get("product_code", "SIP_2000")
    confidence = event_data.get("confidence", 0.0)
    customer_id = customer.get("id", "")
    name = customer.get("name", "Customer").split()[0]
    age = customer.get("age", 30)
    profile = customer.get("profile", {})

    # Salary from transactions
    txns = customer.get("transactions", [])
    salary_txns = [t for t in txns if t.get("category") == "salary"]
    avg_salary = int(sum(abs(t["amount"]) for t in salary_txns) / len(salary_txns)) if salary_txns else 50000

    params = _build_params(product_code, customer_id, name, age, avg_salary, profile, source, confidence)
    encoded = urllib.parse.urlencode(params)

    yono_link   = f"yono://enroll/{product_code.lower()}?{encoded}"
    web_fallback = f"https://yonobusiness.sbi/enroll/{product_code.lower()}?{encoded}"

    screen_info = _get_screen_info(product_code, name, avg_salary, age)

    return {
        "customer_id": customer_id,
        "product_code": product_code,
        "yono_deeplink": yono_link,
        "web_fallback": web_fallback,
        "screen_title": screen_info["title"],
        "pre_filled_fields": screen_info["fields"],
        "one_tap_message": screen_info["message"],
        "params": params,
        "utm_source": source,
    }


def _build_params(
    product_code: str,
    customer_id: str,
    name: str,
    age: int,
    salary: int,
    profile: dict,
    source: str,
    confidence: float,
) -> dict[str, str]:
    base = {
        "cid": customer_id,
        "src": source,
        "conf": str(round(confidence, 2)),
        "name": name,
    }

    product_params = {
        "SIP_2000": {
            "amount": "2000",
            "frequency": "monthly",
            "fund": "SBI_BLUECHIP",
            "tenure_months": "36",
        },
        "CARD_UPGRADE": {
            "current_limit": str(profile.get("credit_score", 700) // 10 * 100),
            "requested_limit": "100000",
            "card_type": "SBI_SIMPLY_CLICK",
        },
        "TERM_PLAN": {
            "sum_assured": "10000000",
            "tenure_years": str(max(60 - age, 10)),
            "premium_frequency": "monthly",
        },
        "LIFE_PROTECT": {
            "sum_assured": "10000000",
            "premium_paying_term": str(max(60 - age, 10)),
        },
        "JOINT_ACC_HOMELOAN": {
            "account_type": "joint_savings",
            "home_loan_amount": str(min(salary * 60, 5000000)),
            "tenure_years": "20",
            "interest_rate": "8.50",
        },
        "CHILD_PLAN": {
            "premium_amount": "2000",
            "frequency": "monthly",
            "policy_term": "21",
        },
        "SAVINGS_OPT": {
            "sweep_threshold": "25000",
            "fd_auto_renew": "true",
        },
    }
    base.update(product_params.get(product_code, {}))
    return base


def _get_screen_info(
    product_code: str,
    name: str,
    salary: int,
    age: int,
) -> dict[str, Any]:
    screens = {
        "SIP_2000": {
            "title": f"Start SIP — Pre-filled for {name}",
            "fields": ["Amount: ₹2,000/month ✓", "Fund: SBI Bluechip ✓", "Tenure: 3 years ✓"],
            "message": f"Tap 'Confirm' to start your ₹2,000/month SIP. One tap, done! ✅",
        },
        "CARD_UPGRADE": {
            "title": f"Card Upgrade — Ready for {name}",
            "fields": ["New Limit: ₹1,00,000 ✓", "Card: SBI SimplyCLICK ✓", "Instant approval ✓"],
            "message": f"Tap 'Approve' — credit card upgrade in 60 seconds. ✅",
        },
        "TERM_PLAN": {
            "title": f"Term Plan — Pre-filled for {name}",
            "fields": [f"Cover: ₹1 Crore ✓", f"Tenure: {max(60-age,10)} years ✓", "Premium: ~₹600/month ✓"],
            "message": f"Tap 'Get Covered' — ₹1 crore protection starts today. ✅",
        },
        "LIFE_PROTECT": {
            "title": f"Smart Protect — Ready for {name}",
            "fields": ["Cover: ₹1 Crore ✓", "Return of Premium ✓", "Tax Benefit u/s 80C ✓"],
            "message": f"Tap 'Start Policy' — complete in 2 minutes. ✅",
        },
        "JOINT_ACC_HOMELOAN": {
            "title": f"Joint Account — Pre-filled for {name}",
            "fields": ["Account Type: Joint Savings ✓", f"Home Loan: Up to ₹{salary*60//100000}L pre-approved ✓", "Rate: 8.50% p.a. ✓"],
            "message": f"Tap 'Open Account' — joint account live in 10 minutes. ✅",
        },
        "CHILD_PLAN": {
            "title": f"Child Plan — Pre-filled for {name}",
            "fields": ["Premium: ₹2,000/month ✓", "Payouts at age 18,19,20,21 ✓", "Waiver of premium ✓"],
            "message": f"Tap 'Protect My Child' — policy starts instantly. ✅",
        },
    }
    return screens.get(product_code, {
        "title": f"Enroll — {name}",
        "fields": ["Pre-filled ✓"],
        "message": "Tap to complete enrollment. ✅",
    })


def generate_whatsapp_deeplink_message(
    customer: dict[str, Any],
    event_data: dict[str, Any],
) -> str:
    """
    Generate the WhatsApp message that includes the deeplink.
    Used by Agent 3 when deeplink mode is enabled.
    """
    link_data = generate_deeplink(customer, event_data)
    name = customer.get("name", "Customer").split()[0]

    return (
        f"{link_data['one_tap_message']}\n\n"
        f"👉 *YONO mein open karein (1 tap enrollment):*\n"
        f"{link_data['web_fallback']}\n\n"
        f"Link 24 ghante valid hai. — SBI LifePulse"
    )
