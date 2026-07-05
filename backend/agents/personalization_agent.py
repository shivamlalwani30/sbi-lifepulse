"""
Agent 3 — Personalization Agent (Claude-powered)
Generates hyper-personalized WhatsApp messages in Hindi-English mix
using Claude claude-sonnet-4-6. Each message is unique to the customer's
detected life event and profile.
"""

import os
import httpx
from typing import Any

ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"
MODEL = "claude-3-5-sonnet-20240620"


def _build_system_prompt() -> str:
    return """You are SBI LifePulse, a proactive and friendly AI assistant for State Bank of India.

Your job is to write a WhatsApp message to an SBI customer based on a life event you have detected from their transaction patterns.

RULES:
- Write in a natural Hindi-English mix (Hinglish) — warm, friendly, like a trusted advisor
- Maximum 3 sentences. Never more.
- Start with a warm acknowledgment of their life situation (don't say "we detected")
- Mention the specific SBI product naturally — not like a sales pitch
- End with a clear, simple YES/NO question
- Never use exclamation marks more than once
- Never mention transaction data, surveillance, or monitoring
- Sign off as: — SBI LifePulse

TONE: Think of a helpful friend at SBI who genuinely noticed something and wants to help. Warm, brief, specific."""


def _build_user_prompt(customer: dict, event_data: dict) -> str:
    name = customer.get("name", "Customer").split()[0]
    event = event_data.get("top_event", "no_event")
    product = event_data.get("recommended_product", "SBI Product")
    pitch = event_data.get("pitch_angle", "")
    confidence = event_data.get("confidence", 0)
    signals = event_data.get("signals_summary", {})

    context_map = {
        "salary_hike": f"Their salary grew by {signals.get('salary_trend_pct', 0):.0f}% over 3 months. {pitch}.",
        "city_relocation": f"They recently moved to {signals.get('new_city', 'a new city')} from {signals.get('original_city', 'their previous city') if 'original_city' in signals else 'their previous city'}. {pitch}.",
        "new_emi_detected": f"They just started a new EMI of ₹{signals.get('emi_amount', 0):,}/month with {signals.get('emi_merchant', 'a lender')}. {pitch}.",
        "insurance_gap": f"They have a good income but no insurance premium detected in 6 months. {pitch}.",
        "marriage_detected": f"They appear to be getting married soon based on spending patterns. {pitch}.",
        "new_baby_detected": f"They recently had a baby based on hospital and baby product spending. {pitch}.",
        "no_event": f"They have a healthy balance and could benefit from savings optimization. {pitch}.",
    }

    context = context_map.get(event, pitch)

    return f"""Write a WhatsApp message for this customer:

Customer first name: {name}
Life event detected: {event.replace('_', ' ').title()} (confidence: {confidence:.0%})
Recommended SBI product: {product}
Context: {context}

Write the message now. Just the message text — no labels, no JSON, no explanation."""


async def run(customer: dict[str, Any], event_data: dict[str, Any], variant_style: str = "") -> dict[str, Any]:
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise ValueError("ANTHROPIC_API_KEY environment variable not set")

    prompt = _build_user_prompt(customer, event_data)
    if variant_style:
        prompt += f"\n\nTone/style instruction: {variant_style}"

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            ANTHROPIC_API_URL,
            headers={
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": MODEL,
                "max_tokens": 300,
                "system": _build_system_prompt(),
                "messages": [
                    {"role": "user", "content": prompt}
                ],
            },
        )
        response.raise_for_status()
        data = response.json()

    message_text = data["content"][0]["text"].strip()

    return {
        "customer_id": customer["id"],
        "customer_name": customer["name"],
        "customer_phone": customer.get("phone"),
        "event": event_data.get("top_event"),
        "product_code": event_data.get("product_code"),
        "whatsapp_message": message_text,
        "outreach_status": "sent",
    }
