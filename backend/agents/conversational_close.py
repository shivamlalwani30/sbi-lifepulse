"""
Agent 4 — Conversational Close Agent (Claude-powered)
Continues the WhatsApp conversation with the customer after the initial outreach message.
Handles YES/NO/unclear replies and drives toward product enrollment.
Uses Claude claude-sonnet-4-6 with full conversation history for context.
"""

import os
import time
try:
    import httpx
    HAS_HTTPX = True
except ImportError:
    HAS_HTTPX = False
from typing import Any
from agents.intent_classifier import classify_intent

ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"
MODEL = "claude-3-5-sonnet-20240620"


def _build_system_prompt(customer: dict, event_data: dict, outreach_msg: str) -> str:
    name = customer.get("name", "Customer").split()[0]
    product = event_data.get("recommended_product", "SBI Product")
    product_code = event_data.get("product_code", "PRODUCT")
    event = event_data.get("top_event", "no_event")

    enrollment_steps = {
        "SIP_2000": "Ask for: (1) SIP amount they want (suggest ₹2,000/month to start), (2) confirm their registered mobile for OTP. Then say enrollment is done.",
        "CARD_UPGRADE": "Ask for: (1) confirm their current card limit, (2) ask preferred new limit (suggest ₹1L). Then say upgrade request is submitted.",
        "TERM_PLAN": "Ask for: (1) sum assured they want (suggest ₹50L), (2) confirm nominee name. Then say policy issuance has started.",
        "LIFE_PROTECT": "Ask for: (1) coverage amount preferred (suggest ₹1 crore), (2) confirm their age and health status (just yes/no). Then say application is submitted.",
        "JOINT_ACC_HOMELOAN": "Ask for: (1) partner's full name, (2) confirm their PAN is linked to their SBI account. Then say joint account opening is initiated.",
        "CHILD_PLAN": "Ask for: (1) child's name and date of birth, (2) monthly premium budget (suggest ₹2,000). Then say child plan enrollment is in progress.",
        "SAVINGS_OPT": "Ask for: (1) confirm they want to move idle balance to SBI Savings Plus. Then say it's activated.",
    }

    steps = enrollment_steps.get(product_code, "Collect basic confirmation and process enrollment.")

    return f"""You are SBI LifePulse, a warm and efficient WhatsApp assistant for State Bank of India.

You are in an ongoing conversation with {name}, an SBI customer.
You already sent them this opening message:
"{outreach_msg}"

Your job: Complete enrollment for "{product}" conversationally.

ENROLLMENT FLOW:
{steps}

RULES:
- Replies must be 1-3 sentences max — this is WhatsApp, not email
- Use warm Hinglish tone — natural, like a helpful bank friend
- If customer says YES or agrees → move to next enrollment step
- If customer says NO or hesitates → acknowledge respectfully, offer to remind them later, and say "Just reply STOP anytime to opt out"
- If customer is unclear → gently re-ask in a simpler way
- Never ask for OTP, password, or full account number in chat
- Once all details collected → confirm enrollment with: "✅ Done! [Product name] is activated/submitted. You'll get an SMS confirmation shortly. — SBI LifePulse"
- After enrollment confirmation, set enrollment_status to "enrolled" in your response

IMPORTANT: After your message, on a NEW LINE, write exactly:
STATUS: pending
or
STATUS: enrolled
or  
STATUS: opted_out

This status line tells the system what happened."""


def _parse_status(response_text: str) -> tuple[str, str]:
    """Extract STATUS line from Claude response and return (message, status)."""
    lines = response_text.strip().split("\n")
    status = "pending"
    message_lines = []

    for line in lines:
        stripped = line.strip()
        if stripped.startswith("STATUS:"):
            raw_status = stripped.replace("STATUS:", "").strip().lower()
            if raw_status in ("enrolled", "opted_out", "pending"):
                status = raw_status
        else:
            message_lines.append(line)

    message = "\n".join(message_lines).strip()
    return message, status


async def run(
    customer: dict[str, Any],
    event_data: dict[str, Any],
    outreach_message: str,
    conversation_history: list[dict[str, str]],
    new_user_message: str,
) -> dict[str, Any]:
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise ValueError("ANTHROPIC_API_KEY environment variable not set")

    system_prompt = _build_system_prompt(customer, event_data, outreach_message)

    messages = list(conversation_history)
    messages.append({"role": "user", "content": new_user_message})

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
                "max_tokens": 400,
                "system": system_prompt,
                "messages": messages,
            },
        )
        response.raise_for_status()
        data = response.json()

    raw_reply = data["content"][0]["text"].strip()
    reply_message, enrollment_status = _parse_status(raw_reply)

    updated_history = list(conversation_history)
    updated_history.append({"role": "user", "content": new_user_message})
    updated_history.append({"role": "assistant", "content": reply_message})

    t_end = time.time()
    return {
        "customer_id": customer["id"],
        "reply_message": reply_message,
        "enrollment_status": enrollment_status,
        "conversation_history": updated_history,
        "product_code": event_data.get("product_code"),
        "recommended_product": event_data.get("recommended_product"),
        "intent": intent_result,
        "response_time_ms": round((t_end - t_start) * 1000),
    }
