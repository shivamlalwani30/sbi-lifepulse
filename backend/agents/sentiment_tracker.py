"""
Conversation Sentiment Tracker
Tracks customer sentiment across conversation turns.
If frustration detected → de-escalate, offer callback.
If high interest → accelerate toward close.
Runs after intent classifier, before Close Agent responds.
"""

import re
from typing import Any

POSITIVE_SIGNALS = [
    "good", "great", "nice", "awesome", "perfect", "love", "thanks",
    "shukriya", "bahut achha", "bilkul", "zaroor", "theek hai",
    "interesting", "tell me more", "aur batao", "samajh gaya",
    "👍","🙏","😊","❤️","✅","🎉","💯",
]

NEGATIVE_SIGNALS = [
    "annoying", "frustrated", "angry", "stop bothering", "leave me alone",
    "worst", "spam", "bakwaas", "band karo", "mat bhejo", "pareshaan",
    "galat", "wrong", "cheat", "fraud", "scam", "fake sbi",
    "😠","😤","🤬","👎","❌","🙅",
]

CONFUSION_SIGNALS = [
    "what", "kya", "samajh nahi", "confused", "unclear", "explain",
    "matlab", "means", "i don't understand", "pata nahi kya bol rahe",
]

URGENCY_SIGNALS = [
    "urgent", "asap", "jaldi", "abhi", "immediately", "right now",
    "emergency", "today", "aaj hi",
]


def analyze_sentiment(message: str) -> dict[str, Any]:
    """Analyze sentiment of a single message."""
    text = message.lower().strip()

    pos = sum(1 for s in POSITIVE_SIGNALS if s in text)
    neg = sum(1 for s in NEGATIVE_SIGNALS if s in text)
    conf = sum(1 for s in CONFUSION_SIGNALS if s in text)
    urg = sum(1 for s in URGENCY_SIGNALS if s in text)

    # Exclamation marks = emotion intensity
    exclamations = text.count("!")
    questions = text.count("?")
    caps_ratio = sum(1 for c in message if c.isupper()) / max(len(message), 1)

    # Score: +1 per positive, -1 per negative
    raw_score = pos - neg
    # Normalize to -1 to +1
    magnitude = max(pos + neg, 1)
    normalized = raw_score / magnitude if (pos + neg) > 0 else 0.0

    if neg >= 2 or caps_ratio > 0.5:
        label = "frustrated"
    elif neg == 1:
        label = "negative"
    elif conf >= 1:
        label = "confused"
    elif pos >= 2 or urg >= 1:
        label = "highly_positive"
    elif pos == 1:
        label = "positive"
    else:
        label = "neutral"

    return {
        "label": label,
        "score": round(normalized, 2),
        "positive_signals": pos,
        "negative_signals": neg,
        "confusion_signals": conf,
        "urgency_signals": urg,
        "intensity": "high" if (exclamations >= 2 or caps_ratio > 0.3) else "normal",
    }


def track_conversation_sentiment(
    conversation_history: list[dict[str, str]],
) -> dict[str, Any]:
    """
    Analyze sentiment trend across full conversation history.
    Returns strategy recommendation for the Close Agent.
    """
    user_messages = [m["content"] for m in conversation_history if m["role"] == "user"]

    if not user_messages:
        return _make_tracker_result([], "neutral", "standard")

    turn_sentiments = [analyze_sentiment(m) for m in user_messages]
    labels = [s["label"] for s in turn_sentiments]

    # Trend analysis
    recent = labels[-2:] if len(labels) >= 2 else labels
    all_neg = all(l in ("frustrated", "negative") for l in recent)
    all_pos = all(l in ("positive", "highly_positive") for l in recent)
    escalating_neg = (
        len(labels) >= 2
        and labels[-1] in ("frustrated", "negative")
        and labels[-2] in ("neutral", "confused")
    )

    # Overall sentiment
    scores = [s["score"] for s in turn_sentiments]
    avg_score = sum(scores) / len(scores)

    if avg_score <= -0.4 or all_neg:
        overall = "frustrated"
    elif avg_score <= -0.1:
        overall = "negative"
    elif avg_score >= 0.4 or all_pos:
        overall = "enthusiastic"
    elif avg_score >= 0.1:
        overall = "positive"
    else:
        overall = "neutral"

    # Strategy recommendation
    strategy = _recommend_strategy(overall, escalating_neg, labels)

    return _make_tracker_result(turn_sentiments, overall, strategy, avg_score, labels)


def _recommend_strategy(
    overall: str,
    escalating_neg: bool,
    labels: list[str],
) -> str:
    frustration_count = sum(1 for l in labels if l in ("frustrated", "negative"))

    if frustration_count >= 2:
        return "de_escalate"      # Back off, offer callback
    if escalating_neg:
        return "address_concern"  # Ask what's wrong before pitching
    if overall == "enthusiastic":
        return "accelerate"       # Move fast, don't over-explain
    if overall in ("frustrated", "negative"):
        return "de_escalate"
    if overall == "neutral" and len(labels) >= 3:
        return "re_engage"        # Getting boring — try a different angle
    return "standard"             # Normal flow


def _make_tracker_result(
    turn_sentiments: list,
    overall: str,
    strategy: str,
    avg_score: float = 0.0,
    labels: list = None,
) -> dict[str, Any]:
    strategy_notes = {
        "standard":        "Continue normal enrollment flow.",
        "accelerate":      "Customer is excited — skip confirmations, move to enrollment fast.",
        "de_escalate":     "Customer frustrated — acknowledge, offer human callback or opt-out gracefully.",
        "address_concern": "Negative trend detected — ask 'Koi concern hai?' before re-pitching.",
        "re_engage":       "Conversation stalling — try a fresh angle: lead with the number (₹X saves per year).",
    }

    color_map = {
        "enthusiastic": "#22c55e",
        "positive":     "#60a5fa",
        "neutral":      "#94a3b8",
        "negative":     "#f59e0b",
        "frustrated":   "#ef4444",
    }

    return {
        "overall_sentiment": overall,
        "sentiment_color": color_map.get(overall, "#94a3b8"),
        "avg_score": round(avg_score, 2),
        "strategy": strategy,
        "strategy_note": strategy_notes.get(strategy, ""),
        "turn_count": len(turn_sentiments),
        "turns": turn_sentiments,
        "sentiment_labels": labels or [],
        "alert": strategy in ("de_escalate", "address_concern"),
    }
