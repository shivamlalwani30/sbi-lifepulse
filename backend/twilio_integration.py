"""
Twilio WhatsApp Integration
Sends REAL WhatsApp messages to customer phones via Twilio Sandbox.

Setup (free, 5 minutes):
1. Go to https://console.twilio.com
2. Activate WhatsApp Sandbox
3. Add to .env:
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_WHATSAPP_FROM=whatsapp:+14155238886  (sandbox number)

Demo usage:
- Set TWILIO_DEMO_PHONE=whatsapp:+91XXXXXXXXXX in .env
- Call /api/twilio/send/{customer_id} to send real message
- Jury member receives actual WhatsApp from "SBI LifePulse"

In production:
- Use verified SBI WhatsApp Business Account
- Replace sandbox number with SBI's registered number
"""

import os
import json
from typing import Any

try:
    from twilio.rest import Client as TwilioClient
    HAS_TWILIO = True
except ImportError:
    HAS_TWILIO = False


def is_configured() -> bool:
    """Return True if Twilio credentials are set."""
    return bool(
        os.environ.get("TWILIO_ACCOUNT_SID") and
        os.environ.get("TWILIO_AUTH_TOKEN") and
        HAS_TWILIO
    )


def get_status() -> dict[str, Any]:
    return {
        "twilio_available": HAS_TWILIO,
        "configured": is_configured(),
        "account_sid_set": bool(os.environ.get("TWILIO_ACCOUNT_SID")),
        "auth_token_set": bool(os.environ.get("TWILIO_AUTH_TOKEN")),
        "from_number_set": bool(os.environ.get("TWILIO_WHATSAPP_FROM")),
        "demo_phone_set": bool(os.environ.get("TWILIO_DEMO_PHONE")),
        "sandbox_number": os.environ.get("TWILIO_WHATSAPP_FROM", "whatsapp:+14155238886"),
        "setup_url": "https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn",
    }


def send_whatsapp(
    to_number: str,
    message: str,
    customer_name: str = "Customer",
) -> dict[str, Any]:
    """
    Send a real WhatsApp message via Twilio.
    to_number format: whatsapp:+919876543210
    """
    if not is_configured():
        return {
            "sent": False,
            "error": "Twilio not configured. Add TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN to .env",
            "fallback": "Showing WhatsApp simulation instead",
        }

    # Ensure format
    if not to_number.startswith("whatsapp:"):
        to_number = f"whatsapp:{to_number}"

    from_number = os.environ.get("TWILIO_WHATSAPP_FROM", "whatsapp:+14155238886")

    try:
        client = TwilioClient(
            os.environ["TWILIO_ACCOUNT_SID"],
            os.environ["TWILIO_AUTH_TOKEN"],
        )
        msg = client.messages.create(
            from_=from_number,
            to=to_number,
            body=message,
        )
        return {
            "sent": True,
            "message_sid": msg.sid,
            "status": msg.status,
            "to": to_number,
            "from": from_number,
            "body_preview": message[:80] + "..." if len(message) > 80 else message,
        }
    except Exception as e:
        return {
            "sent": False,
            "error": str(e),
            "to": to_number,
        }


def send_to_demo_phone(message: str, customer_name: str = "") -> dict[str, Any]:
    """
    Send to the demo phone configured in TWILIO_DEMO_PHONE.
    Use this on stage at GFF — jury member's phone receives the message.
    """
    demo_phone = os.environ.get("TWILIO_DEMO_PHONE")
    if not demo_phone:
        return {
            "sent": False,
            "error": "TWILIO_DEMO_PHONE not set in .env",
            "hint": "Add TWILIO_DEMO_PHONE=whatsapp:+91XXXXXXXXXX to .env",
        }
    return send_whatsapp(demo_phone, message, customer_name)


def format_for_whatsapp(message: str) -> str:
    """
    Format a message for WhatsApp delivery.
    WhatsApp supports *bold*, _italic_, ~strikethrough~, ```code```.
    """
    # Add SBI branding header
    return f"*SBI LifePulse* 🏦\n\n{message}"
