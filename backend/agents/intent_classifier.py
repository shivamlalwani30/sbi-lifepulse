"""
Intent Classifier Agent
Classifies a customer's WhatsApp reply into intent categories.
Used by the Conversational Close Agent to pick the right response strategy.

Intent categories:
- STRONG_YES   : "haan", "yes", "kar do", "bilkul", "zaroor" — close immediately
- SOFT_YES     : "theek hai", "ok", "soch ke bataun" — proceed with light confirmation
- QUESTION     : customer is asking for more info — answer and re-pitch
- HESITATION   : "pata nahi", "baad mein" — address concern, don't push
- REJECTION    : "nahi", "no", "mat karo" — graceful exit
- PRICE_CONCERN: mentions money/cost — reframe value
- WRONG_PERSON : "galat number", "who is this" — explain and offer opt-out
- UNCLEAR      : emoji only, single word, gibberish — re-ask simply

This runs locally (no LLM needed) so it adds zero latency.
"""

import re
from typing import Any

# Keyword maps (case-insensitive)
STRONG_YES_KEYWORDS = [
    "yes", "haan", "ha", "han", "kar do", "karo", "bilkul", "zaroor",
    "sure", "absolutely", "definitely", "proceed", "go ahead", "start",
    "agree", "ok", "okay", "done", "theek", "ho jaye", "ho jayega",
    "start karo", "enroll", "sign up", "apply", "approve", "accept",
]

SOFT_YES_KEYWORDS = [
    "soch ke batata", "soch ke batati", "let me think", "maybe", "shayad",
    "sounds good", "interesting", "tell me more", "batao aur", "aur batao",
    "how much", "kitna", "details", "more info",
]

REJECTION_KEYWORDS = [
    "no", "nahi", "nahi chahiye", "mat karo", "band karo", "stop",
    "not interested", "interested nahi", "cancel", "don't", "dont",
    "opt out", "unsubscribe", "remove", "delete", "leave me alone",
    "jane do", "rehne do", "chhodo", "baad mein", "later", "abhi nahi",
]

HESITATION_KEYWORDS = [
    "pata nahi", "don't know", "sochna padega", "think karna padega",
    "wife se puchna", "husband se puchna", "family se puchna", "discuss",
    "not sure", "confused", "samajh nahi", "clear nahi",
    "what if", "kya hoga", "risk", "safe hai", "guaranteed",
]

PRICE_KEYWORDS = [
    "kitna", "how much", "price", "cost", "fees", "charge", "amount",
    "mehenga", "expensive", "costly", "afford", "budget", "paisa",
    "paise", "rupees", "rs ", "₹", "monthly", "premium", "rate",
]

QUESTION_KEYWORDS = [
    "kya", "what", "how", "kyun", "why", "when", "kab", "where",
    "kaisa", "kaise", "explain", "samjhao", "tell me", "batao",
    "difference", "benefit", "fayda", "returns", "interest",
    "?", "kyu", "kyunki",
]

WRONG_PERSON_KEYWORDS = [
    "galat", "wrong number", "kaun", "who are you", "yeh kya hai",
    "spam", "fraud", "scam", "fake",
]


def classify_intent(message: str) -> dict[str, Any]:
    """
    Classify the intent of a customer's WhatsApp reply.
    Returns intent, confidence, and a suggested Close Agent strategy.
    """
    if not message or not message.strip():
        return _make_result("UNCLEAR", 0.5, "Empty message")

    text = message.lower().strip()

    import re as _re
    def word_match(kw, t):
        # For single short words (<=3 chars), match as whole word only
        if len(kw) <= 3 and kw.isalpha():
            return bool(_re.search(r'\b' + _re.escape(kw) + r'\b', t))
        return kw in t

    # Check wrong person first
    for kw in WRONG_PERSON_KEYWORDS:
        if word_match(kw, text):
            return _make_result("WRONG_PERSON", 0.95, f"Keyword: '{kw}'")

    # Strong rejection
    rejection_hits = [kw for kw in REJECTION_KEYWORDS if word_match(kw, text)]
    if rejection_hits:
        # "abhi nahi" and "baad mein" are softer rejections
        soft = any(kw in text for kw in ["baad mein", "later", "abhi nahi", "sochna", "think"])
        if soft:
            return _make_result("HESITATION", 0.80, f"Soft: '{rejection_hits[0]}'")
        return _make_result("REJECTION", 0.95, f"Keyword: '{rejection_hits[0]}'")

    # Price concern
    price_hits = [kw for kw in PRICE_KEYWORDS if word_match(kw, text)]
    if price_hits:
        return _make_result("PRICE_CONCERN", 0.90, f"Keyword: '{price_hits[0]}'")

    # Strong yes — check first before question (yes + question = still yes)
    yes_hits = [kw for kw in STRONG_YES_KEYWORDS if word_match(kw, text)]
    if yes_hits:
        # If also contains question words, it's soft yes + question
        q_hits = [kw for kw in QUESTION_KEYWORDS if kw in text]
        if q_hits and "?" in text:
            return _make_result("SOFT_YES", 0.75, f"Yes with question: '{yes_hits[0]}'")
        return _make_result("STRONG_YES", 0.95, f"Keyword: '{yes_hits[0]}'")

    # Hesitation
    hesitation_hits = [kw for kw in HESITATION_KEYWORDS if word_match(kw, text)]
    if hesitation_hits:
        return _make_result("HESITATION", 0.85, f"Keyword: '{hesitation_hits[0]}'")

    # Question
    question_hits = [kw for kw in QUESTION_KEYWORDS if word_match(kw, text)]
    if question_hits or "?" in text:
        return _make_result("QUESTION", 0.80, f"Question detected")

    # Soft yes
    soft_hits = [kw for kw in SOFT_YES_KEYWORDS if word_match(kw, text)]
    if soft_hits:
        return _make_result("SOFT_YES", 0.80, f"Keyword: '{soft_hits[0]}'")

    # Pure emoji check
    emoji_only = re.sub(r'[\U00010000-\U0010ffff]', '', text).strip()
    if not emoji_only:
        # Thumbs up / heart emojis = yes
        if any(e in message for e in ["👍", "✅", "❤️", "😊", "🙏"]):
            return _make_result("STRONG_YES", 0.75, "Positive emoji")
        if any(e in message for e in ["👎", "❌", "😠", "🙅"]):
            return _make_result("REJECTION", 0.70, "Negative emoji")
        return _make_result("UNCLEAR", 0.50, "Emoji only — unclear")

    # Default: unclear but leaning question if short
    if len(text.split()) <= 3:
        return _make_result("UNCLEAR", 0.55, "Too short to classify")

    return _make_result("UNCLEAR", 0.40, "No strong signals")


def _make_result(intent: str, confidence: float, reason: str) -> dict[str, Any]:
    strategies = {
        "STRONG_YES":    "Proceed immediately to next enrollment step. Don't ask for confirmation again.",
        "SOFT_YES":      "Acknowledge positively, answer any implicit question, then move to next step.",
        "QUESTION":      "Answer the question clearly and concisely, then re-present the YES/NO choice.",
        "HESITATION":    "Acknowledge the concern empathetically. Offer a softer commitment or more time.",
        "REJECTION":     "Thank them graciously, confirm opt-out, offer to reach out later.",
        "PRICE_CONCERN": "Lead with value, not cost. Give specific numbers. Then re-ask.",
        "WRONG_PERSON":  "Apologize for the confusion, explain LifePulse briefly, offer opt-out.",
        "UNCLEAR":       "Ask a simpler, more direct YES/NO question. Keep it to one sentence.",
    }
    urgency = {
        "STRONG_YES": "high",
        "SOFT_YES": "medium",
        "QUESTION": "medium",
        "HESITATION": "low",
        "REJECTION": "none",
        "PRICE_CONCERN": "medium",
        "WRONG_PERSON": "none",
        "UNCLEAR": "low",
    }
    return {
        "intent": intent,
        "confidence": round(confidence, 2),
        "reason": reason,
        "strategy": strategies[intent],
        "urgency": urgency[intent],
        "should_continue": intent not in ("REJECTION", "WRONG_PERSON"),
    }


def batch_classify(messages: list[str]) -> list[dict[str, Any]]:
    """Classify a list of messages at once."""
    return [classify_intent(m) for m in messages]
