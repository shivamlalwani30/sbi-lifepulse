"""
Multi-Language Message Agent
Generates WhatsApp messages in regional Indian languages based on customer city.
This addresses SBI's rural/Tier-2/3 penetration — not everyone reads English.

Language mapping by region:
- Hindi belt (UP, Bihar, MP, Rajasthan, Delhi, Jharkhand): Hindi
- South India Tamil regions: Tamil
- Andhra/Telangana: Telugu  
- West Bengal/Assam: Bengali
- Maharashtra/Goa: Marathi
- Kerala: Malayalam
- Karnataka: Kannada
- Default: Hinglish (Hindi-English mix)
"""

import os
try:
    import httpx
    HAS_HTTPX = True
except ImportError:
    HAS_HTTPX = False
    import urllib.request as _urllib
from typing import Any

ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"
MODEL = "claude-3-5-sonnet-20240620"

# City → language mapping
CITY_LANGUAGE = {
    # Hindi belt
    "lucknow": "hindi", "patna": "hindi", "jaipur": "hindi",
    "bhopal": "hindi", "indore": "hindi", "agra": "hindi",
    "varanasi": "hindi", "kanpur": "hindi", "allahabad": "hindi",
    "dehradun": "hindi", "delhi": "hindi", "noida": "hindi",
    "gurgaon": "hindi", "ranchi": "hindi", "raipur": "hindi",
    # South
    "chennai": "tamil", "coimbatore": "tamil", "madurai": "tamil",
    "hyderabad": "telugu", "vizag": "telugu", "vijayawada": "telugu",
    "bengaluru": "kannada", "mysuru": "kannada", "hubli": "kannada",
    "kochi": "malayalam", "thiruvananthapuram": "malayalam", "kozhikode": "malayalam",
    # East
    "kolkata": "bengali", "siliguri": "bengali", "asansol": "bengali",
    # West
    "mumbai": "marathi", "pune": "marathi", "nagpur": "marathi", "nashik": "marathi",
    # Default
    "surat": "gujarati", "ahmedabad": "gujarati",
}

LANGUAGE_NAMES = {
    "hindi": "Hindi",
    "tamil": "Tamil",
    "telugu": "Telugu",
    "kannada": "Kannada",
    "malayalam": "Malayalam",
    "bengali": "Bengali",
    "marathi": "Marathi",
    "gujarati": "Gujarati",
    "hinglish": "Hinglish (Hindi-English mix)",
}

LANGUAGE_INSTRUCTIONS = {
    "hindi": "Write entirely in Hindi (Devanagari script). Formal but warm. End with a YES/NO question in Hindi.",
    "tamil": "Write in Tamil script. Warm and respectful tone. End with a YES/NO question in Tamil.",
    "telugu": "Write in Telugu script. Warm and respectful tone. End with a YES/NO question in Telugu.",
    "kannada": "Write in Kannada script. Warm and respectful tone. End with a YES/NO question in Kannada.",
    "malayalam": "Write in Malayalam script. Warm and respectful. End with a YES/NO question in Malayalam.",
    "bengali": "Write in Bengali (Bangla) script. Warm and respectful. End with a YES/NO question in Bengali.",
    "marathi": "Write in Marathi (Devanagari script). Warm tone. End with a YES/NO question in Marathi.",
    "gujarati": "Write in Gujarati script. Warm and friendly. End with a YES/NO question in Gujarati.",
    "hinglish": "Write in natural Hindi-English mix (Hinglish). Casual, friendly tone like a helpful friend. End with a YES/NO question.",
}


def detect_language(customer: dict[str, Any]) -> str:
    city = customer.get("city", "").lower().strip()
    return CITY_LANGUAGE.get(city, "hinglish")


def _build_system_prompt(language: str) -> str:
    lang_instruction = LANGUAGE_INSTRUCTIONS.get(language, LANGUAGE_INSTRUCTIONS["hinglish"])
    lang_name = LANGUAGE_NAMES.get(language, "Hinglish")
    return f"""You are SBI LifePulse, a proactive and helpful AI assistant for State Bank of India.

Write a WhatsApp message to an SBI customer about a relevant financial product based on their life situation.

LANGUAGE: {lang_name}
{lang_instruction}

RULES:
- Maximum 3 sentences. Never more.
- Start with warmth about their life situation (do NOT mention transaction data or monitoring)
- Naturally mention the SBI product
- End with a clear YES/NO question
- Keep it conversational — this is WhatsApp, not an email
- Sign as: — SBI LifePulse

Do NOT write anything except the message itself."""


async def generate_multilingual_message(
    customer: dict[str, Any],
    event_data: dict[str, Any],
    language: str | None = None,
) -> dict[str, Any]:
    """
    Generate a WhatsApp message in the customer's regional language.
    If language is None, auto-detect from customer city.
    """
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise ValueError("ANTHROPIC_API_KEY not set")

    if language is None:
        language = detect_language(customer)

    name = customer.get("name", "Customer").split()[0]
    event = event_data.get("top_event", "no_event")
    product = event_data.get("recommended_product", "SBI Product")
    pitch = event_data.get("pitch_angle", "")
    confidence = event_data.get("confidence", 0)

    context_map = {
        "salary_hike": f"Their income grew significantly over the past 3 months. {pitch}.",
        "city_relocation": f"They recently moved to a new city. {pitch}.",
        "new_emi_detected": f"They just started a new loan EMI. {pitch}.",
        "insurance_gap": f"They have good income but no life insurance detected. {pitch}.",
        "marriage_detected": f"They appear to be getting married soon. {pitch}.",
        "new_baby_detected": f"They recently had a baby. {pitch}.",
        "no_event": f"They have a healthy savings balance. {pitch}.",
    }

    user_prompt = f"""Write a WhatsApp message for:
Customer name: {name}
Life event: {event.replace('_', ' ').title()} ({int(confidence * 100)}% confidence)
Recommended product: {product}
Context: {context_map.get(event, pitch)}

Write the message now."""

    import json as _json, asyncio
    payload = _json.dumps({
        "model": MODEL,
        "max_tokens": 300,
        "system": _build_system_prompt(language),
        "messages": [{"role": "user", "content": user_prompt}],
    }).encode()
    headers = {
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
    }
    if HAS_HTTPX:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(ANTHROPIC_API_URL, headers=headers, content=payload)
            resp.raise_for_status()
            data = resp.json()
    else:
        import urllib.request as _ur
        req = _ur.Request(ANTHROPIC_API_URL, data=payload, headers=headers, method="POST")
        with _ur.urlopen(req, timeout=30) as r:
            data = _json.loads(r.read())

    message = data["content"][0]["text"].strip()

    return {
        "customer_id": customer["id"],
        "customer_name": customer["name"],
        "language": language,
        "language_name": LANGUAGE_NAMES.get(language, language),
        "city": customer.get("city"),
        "message": message,
        "event": event,
        "product": product,
    }


async def generate_all_languages(
    customer: dict[str, Any],
    event_data: dict[str, Any],
) -> dict[str, Any]:
    """Generate messages in all major languages for a given customer — demo purpose."""
    import asyncio
    demo_languages = ["hinglish", "hindi", "tamil", "telugu", "bengali", "marathi"]

    results = await asyncio.gather(*[
        generate_multilingual_message(customer, event_data, lang)
        for lang in demo_languages
    ], return_exceptions=True)

    messages = {}
    for lang, result in zip(demo_languages, results):
        if isinstance(result, Exception):
            messages[lang] = {"error": str(result), "language": lang}
        else:
            messages[lang] = result

    return {
        "customer_id": customer["id"],
        "customer_name": customer["name"],
        "auto_detected_language": detect_language(customer),
        "messages": messages,
    }
