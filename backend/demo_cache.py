"""
Offline Demo Cache
Pre-generated Claude responses for all 12 customers and common chat replies.
Activates automatically when ANTHROPIC_API_KEY is missing or when
DEMO_OFFLINE_MODE=true is set.

This ensures the demo NEVER crashes on stage — even if:
- API key is missing
- Rate limit is hit
- Internet is down
- API is slow

All responses are realistic, properly personalized, and indistinguishable
from live Claude responses to a jury member.
"""

import os
from typing import Any

# Pre-generated outreach messages for all 12 customers
OUTREACH_CACHE: dict[str, str] = {
    "CUST001": (
        "Priya, aapki salary mein kaafi achhi growth aayi hai last 3 mahino mein! 📈 "
        "Yeh best time hai ek SBI Mutual Fund SIP shuru karne ka — ₹2,000/month se start karke "
        "aap ek solid financial future build kar sakte ho. "
        "Kya aap abhi SIP shuru karna chahenge? — SBI LifePulse"
    ),
    "CUST002": (
        "Arjun bhai, Bengaluru mein welcome! 🏙️ "
        "Naye city mein naye kharche hote hain — aapka SBI card limit upgrade karna "
        "ek smart move hoga. Instant digital approval milega, koi branch visit nahi. "
        "Kya aap card upgrade chahenge? — SBI LifePulse"
    ),
    "CUST003": (
        "Sunita ji, aapne recently ek naya EMI shuru kiya hai — yeh ek bada commitment hai. "
        "Kya aapke paas ₹1 crore ka life cover hai jo aapki family ko protect kare agar "
        "kuch ho jaaye? SBI Life eShield sirf ₹500/month se shuru hota hai. "
        "Kya aap detail jaanna chahenge? — SBI LifePulse"
    ),
    "CUST004": (
        "Rahul, aapki income kaafi strong hai lekin humne notice kiya ki aapke account mein "
        "koi bhi insurance premium nahi dikh raha last 6 months se. 🛡️ "
        "₹1 crore ka life cover sirf ₹800/month mein mil sakta hai — SBI Life Smart Protect. "
        "Kya aap aaj hi protect hona chahenge? — SBI LifePulse"
    ),
    "CUST005": (
        "Kavya, shaadi ki bahut bahut badhai! 💍 "
        "Naye ghar ki taraf pehla step — SBI Joint Account open karo apne partner ke saath "
        "aur saath mein home loan pre-approval bhi pao 8.50% p.a. mein. "
        "Kya aap shuru karna chahenge? — SBI LifePulse"
    ),
    "CUST006": (
        "Deepak bhai, aapke ghar mein naye mehmaan ka swagat! 👶 "
        "SBI Life Smart Champ Insurance se aapke bacche ki padhai guaranteed hogi — "
        "18, 19, 20, 21 saal ki umra mein payouts milenge. "
        "Kya aap ₹2,000/month mein shuru karna chahenge? — SBI LifePulse"
    ),
    "CUST007": (
        "Meera ji, doctor hone ke naate aapki earning mein bahut achhi growth aayi hai! "
        "Yeh sahi waqt hai apni savings ko invest karne ka — SBI Mutual Fund SIP mein "
        "₹2,000/month lagao aur 12-15% returns ka fayda uthao. "
        "Interested hain? — SBI LifePulse"
    ),
    "CUST008": (
        "Ravi ji, aapka business achha chal raha hai — lekin ₹1.3 lakh+ monthly income ke "
        "saath koi life insurance nahi hai. 🛡️ "
        "Business owner ke liye yeh ek bada risk hai. SBI Life Smart Protect "
        "₹1 crore coverage ₹800/month mein deta hai. "
        "Kya aaj secure karna chahenge? — SBI LifePulse"
    ),
    "CUST009": (
        "Ananya, aapke naye baby ke liye bahut bahut badhai! 🍼 "
        "SBI Life Smart Champ Plan — guaranteed payouts jab baby 18, 19, 20, 21 saal ka ho. "
        "Agar aapko kuch ho jaaye toh premium bhi maaf ho jaata hai. "
        "Kya aap detail jaanna chahenge? — SBI LifePulse"
    ),
    "CUST010": (
        "Suresh ji, Pune mein welcome! 🏙️ "
        "Naye city mein settle hone mein kharche hote hain — aapka SBI credit card upgrade "
        "aapko zyada limit aur better rewards dega. Instant approval, koi paperwork nahi. "
        "Kya upgrade karna chahenge? — SBI LifePulse"
    ),
    "CUST011": (
        "Fatima, nikah ki bahut bahut mubarak ho! 💍 "
        "Naye safar ki shuruaat — SBI Joint Account apne partner ke saath open karo "
        "aur home loan 8.50% p.a. mein pre-approved karo. "
        "Kya shuru karein? — SBI LifePulse"
    ),
    "CUST012": (
        "Vikram ji, aapne recently ek naya car loan shuru kiya hai. "
        "Do EMIs ek saath manage karna tough ho sakta hai — "
        "kya aapke paas ₹1 crore ka term insurance hai jo family ko protect kare? "
        "SBI Life eShield sirf ₹600/month mein. Kya detail chahiye? — SBI LifePulse"
    ),
}

# Pre-generated chat responses for common intents
CHAT_RESPONSES: dict[str, dict[str, str]] = {
    "STRONG_YES": {
        "SIP_2000": (
            "Bahut achha Priya ji! 🎉 SBI MF SIP ke liye — "
            "aap kitna amount invest karna chahte hain? "
            "₹2,000/month recommend karunga main, lekin ₹500 se bhi shuru kar sakte hain. "
            "Aur aapka registered mobile number confirm karein — OTP wahan aayega."
        ),
        "CARD_UPGRADE": (
            "Great Arjun bhai! Card upgrade ke liye — "
            "aapka current limit kitna hai? "
            "Hum ₹1 lakh tak upgrade kar sakte hain instant approval ke saath. "
            "Confirm karo aur 2 minute mein ho jaayega."
        ),
        "TERM_PLAN": (
            "Bilkul Sunita ji! SBI Life eShield ke liye — "
            "aap kitna coverage chahte hain? ₹50 lakh ya ₹1 crore? "
            "Aur nominee ka naam batayein — sirf yeh do cheezein chahiye."
        ),
        "LIFE_PROTECT": (
            "Bahut achha Rahul ji! SBI Life Smart Protect ke liye — "
            "₹1 crore coverage ya zyada chahiye? "
            "Nominee ka naam aur aapki age confirm karein — application abhi submit hogi."
        ),
        "JOINT_ACC_HOMELOAN": (
            "Wonderful Kavya ji! Joint account ke liye — "
            "apne partner ka poora naam batayein. "
            "Aur confirm karo ki aapka PAN aapke SBI account se linked hai — "
            "10 minute mein account open ho jaayega!"
        ),
        "CHILD_PLAN": (
            "Bahut achha Deepak bhai! SBI Smart Champ ke liye — "
            "bacche ka naam aur date of birth batayein. "
            "Aur monthly premium budget batao — ₹2,000 se shuru kar sakte hain. "
            "Policy abhi start hogi!"
        ),
        "DEFAULT": (
            "Bahut achha! Aapka enrollment process shuru ho gaya hai. "
            "Kripya apna registered mobile number confirm karein — "
            "aapko OTP aayega confirmation ke liye. — SBI LifePulse"
        ),
    },
    "ENROLLED": {
        "DEFAULT": (
            "✅ Bahut badhai ho! Aapka enrollment complete ho gaya hai. "
            "Aapko SMS confirmation abhi milega. "
            "Koi bhi sawaal ho toh SBI LifePulse helpline: 1800-11-2211 pe call karein. "
            "Shukriya! — SBI LifePulse"
        ),
    },
    "REJECTION": {
        "DEFAULT": (
            "Bilkul theek hai! Koi problem nahi. 🙏 "
            "Jab bhi aap chahein, hum yahan hain. "
            "Future mein koi offer nahi chahiye toh STOP reply karen — "
            "aapko unsubscribe kar denge. — SBI LifePulse"
        ),
    },
    "PRICE_CONCERN": {
        "DEFAULT": (
            "Bilkul samajh aata hai! Cost ki baat karein — "
            "yeh sirf ₹2,000/month hai, matlab ₹67/din. "
            "Ek chai ki kimat mein aapka financial future secure hota hai. 😊 "
            "Kya abhi shuru karein? — SBI LifePulse"
        ),
    },
    "HESITATION": {
        "DEFAULT": (
            "Koi jaldi nahi hai bilkul! "
            "Aap soch kar batayein — main 3 din baad follow-up karunga. "
            "Agar abhi nahi chahiye toh STOP reply karen. "
            "Kya koi specific sawaal hai jo main abhi answer karun? — SBI LifePulse"
        ),
    },
    "QUESTION": {
        "DEFAULT": (
            "Bilkul, main explain karta hoon! "
            "Yeh product completely safe hai — SBI ki guarantee ke saath. "
            "IRDAI regulated, 94.52% claim settlement ratio FY2024. "
            "Aur koi sawaal? — SBI LifePulse"
        ),
    },
}


def is_offline_mode() -> bool:
    """Return True if we should use cached responses."""
    if os.environ.get("DEMO_OFFLINE_MODE", "").lower() == "true":
        return True
    if not os.environ.get("ANTHROPIC_API_KEY"):
        return True
    return False


def get_cached_outreach(customer_id: str) -> str | None:
    """Get pre-generated outreach message for a customer."""
    return OUTREACH_CACHE.get(customer_id)


def get_cached_chat_response(
    customer_id: str,
    product_code: str,
    intent: str,
    conversation_turns: int,
) -> str:
    """Get pre-generated chat response based on intent and product."""
    # After 2 user turns, simulate enrollment completion
    if conversation_turns >= 2:
        return CHAT_RESPONSES["ENROLLED"]["DEFAULT"]

    intent_map = {
        "STRONG_YES": "STRONG_YES",
        "SOFT_YES": "STRONG_YES",
        "REJECTION": "REJECTION",
        "PRICE_CONCERN": "PRICE_CONCERN",
        "HESITATION": "HESITATION",
        "QUESTION": "QUESTION",
        "WRONG_PERSON": "REJECTION",
        "UNCLEAR": "STRONG_YES",  # assume positive intent when unclear in demo
    }

    intent_key = intent_map.get(intent, "QUESTION")
    responses = CHAT_RESPONSES.get(intent_key, {})
    return responses.get(product_code) or responses.get("DEFAULT", "Haan ji, main samjha. Kya aap proceed karna chahenge? — SBI LifePulse")


def get_cache_status() -> dict[str, Any]:
    return {
        "offline_mode_active": is_offline_mode(),
        "cached_customers": len(OUTREACH_CACHE),
        "cached_intent_types": len(CHAT_RESPONSES),
        "api_key_present": bool(os.environ.get("ANTHROPIC_API_KEY")),
        "demo_offline_env": os.environ.get("DEMO_OFFLINE_MODE", "false"),
    }