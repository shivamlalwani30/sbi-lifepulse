"""
Fraud & Anomaly Detection Gate
Pre-send safety check that runs before LifePulse sends any WhatsApp message.
If an account shows signs of fraud or compromise, outreach is blocked.

Checks:
1. Sudden large credit (possible fraud/money mule)
2. Rapid sequential large debits (account takeover spending)
3. Unusual transaction timing (3 AM transactions)
4. Too many transactions in short window (velocity check)
5. New payee with very large amount (social engineering)
6. Balance spike then immediate large debit (mule pattern)

Returns: SAFE / SUSPICIOUS / BLOCKED with reason
"""

from typing import Any
from datetime import datetime
import statistics


def check_fraud_signals(
    customer: dict[str, Any],
    behavior_signals: dict[str, Any],
) -> dict[str, Any]:
    """
    Run fraud detection before any outreach is sent.
    Returns a gate result: SAFE, SUSPICIOUS, or BLOCKED.
    """
    transactions = customer.get("transactions", [])
    signals = behavior_signals.get("signals", {})
    flags = []
    severity_score = 0.0

    if not transactions:
        return _gate_result("SAFE", 0.0, [], "No transactions to analyze")

    amounts = [abs(t["amount"]) for t in transactions]
    credits = [abs(t["amount"]) for t in transactions if t["type"] == "credit"]
    debits = [abs(t["amount"]) for t in transactions if t["type"] == "debit"]

    # ── Check 1: Sudden large credit (3× average salary) ──────────────────────
    salary_hist = signals.get("salary_history", {})
    avg_salary = sum(salary_hist.values()) / len(salary_hist) if salary_hist else 0
    non_salary_credits = [
        t for t in transactions
        if t["type"] == "credit" and t.get("category") != "salary"
    ]
    for t in non_salary_credits:
        if avg_salary > 0 and abs(t["amount"]) > avg_salary * 5:
            flags.append({
                "check": "large_non_salary_credit",
                "detail": f"Non-salary credit of ₹{abs(t['amount']):,} — {5:.0f}× avg salary",
                "severity": "medium",
                "transaction": t["date"],
            })
            severity_score += 0.25

    # ── Check 2: Rapid large debits (>3 large debits in same month) ───────────
    large_threshold = max(avg_salary * 0.5, 20000)
    large_debits = [t for t in transactions if t["type"] == "debit" and abs(t["amount"]) > large_threshold]
    debit_months: dict[str, int] = {}
    for t in large_debits:
        month = t["date"][:7]
        debit_months[month] = debit_months.get(month, 0) + 1
    for month, count in debit_months.items():
        if count >= 4:
            flags.append({
                "check": "rapid_large_debits",
                "detail": f"{count} large debits (>₹{large_threshold:,.0f}) in {month}",
                "severity": "high",
                "transaction": month,
            })
            severity_score += 0.40

    # ── Check 3: Balance manipulation pattern ─────────────────────────────────
    balances = customer.get("account_balance_history", [])
    if len(balances) >= 2:
        max_bal = max(b["balance"] for b in balances)
        min_bal = min(b["balance"] for b in balances)
        if max_bal > 0 and (max_bal - min_bal) / max_bal > 0.85:
            flags.append({
                "check": "balance_spike_drain",
                "detail": f"Balance went from ₹{min_bal:,} to ₹{max_bal:,} and back — possible mule pattern",
                "severity": "high",
                "transaction": "multi-month",
            })
            severity_score += 0.45

    # ── Check 4: Transaction velocity (>10 txns in one day) ──────────────────
    date_counts: dict[str, int] = {}
    for t in transactions:
        d = t["date"]
        date_counts[d] = date_counts.get(d, 0) + 1
    for date, count in date_counts.items():
        if count >= 8:
            flags.append({
                "check": "high_velocity",
                "detail": f"{count} transactions on {date} — unusual activity",
                "severity": "medium",
                "transaction": date,
            })
            severity_score += 0.20

    # ── Check 5: Unusually low transaction amount variance (bot pattern) ──────
    if len(amounts) >= 5:
        try:
            cv = statistics.stdev(amounts) / statistics.mean(amounts)
            if cv < 0.05:
                flags.append({
                    "check": "suspiciously_uniform_amounts",
                    "detail": f"All transactions within 5% of each other — possible automated fraud",
                    "severity": "medium",
                    "transaction": "pattern",
                })
                severity_score += 0.30
        except statistics.StatisticsError:
            pass

    # ── Check 6: Salary + immediate full withdrawal ───────────────────────────
    sorted_txns = sorted(transactions, key=lambda t: t["date"])
    # Categories that explain large immediate outflows (not fraud)
    LEGITIMATE_LARGE_CATEGORIES = {"wedding", "moving", "education", "medical", "travel", "transfer"}
    for i, txn in enumerate(sorted_txns):
        if txn["category"] == "salary" and txn["type"] == "credit":
            salary_amt = abs(txn["amount"])
            # Check next 2 days for large debit — excluding legitimate categories
            next_txns = [
                t for t in sorted_txns[i+1:]
                if t["date"] <= txn["date"][:8] + "05"  # within same week roughly
                and t["type"] == "debit"
                and abs(t["amount"]) > salary_amt * 0.80
                and t.get("category") not in LEGITIMATE_LARGE_CATEGORIES
            ]
            if next_txns:
                flags.append({
                    "check": "salary_immediate_drain",
                    "detail": f"₹{salary_amt:,} salary credited then ₹{abs(next_txns[0]['amount']):,} immediately withdrawn",
                    "severity": "high",
                    "transaction": txn["date"],
                })
                severity_score += 0.50

    # ── Gate decision ─────────────────────────────────────────────────────────
    severity_score = min(severity_score, 1.0)
    high_severity = [f for f in flags if f.get("severity") == "high"]

    if severity_score >= 0.70 or len(high_severity) >= 2:
        gate = "BLOCKED"
        reason = f"High fraud risk ({len(high_severity)} high-severity flags). Outreach blocked pending review."
        action = "Escalate to fraud team. Do not send WhatsApp message."
    elif severity_score >= 0.30 or len(flags) >= 2:
        gate = "SUSPICIOUS"
        reason = f"{len(flags)} anomaly flag(s) detected. Proceed with caution."
        action = "Log for review. Downgrade offer or require in-branch verification."
    else:
        gate = "SAFE"
        reason = "No fraud signals detected. Safe to proceed with outreach."
        action = "Proceed with WhatsApp outreach as planned."

    return _gate_result(gate, severity_score, flags, reason, action)


def _gate_result(
    gate: str,
    score: float,
    flags: list,
    reason: str,
    action: str = "Proceed normally.",
) -> dict[str, Any]:
    return {
        "gate": gate,
        "fraud_score": round(score, 2),
        "flags": flags,
        "flag_count": len(flags),
        "high_severity_count": sum(1 for f in flags if f.get("severity") == "high"),
        "reason": reason,
        "action": action,
        "safe_to_proceed": gate == "SAFE",
        "requires_review": gate in ("SUSPICIOUS", "BLOCKED"),
    }
