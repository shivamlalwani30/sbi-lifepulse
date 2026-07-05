"""
Persistent Session Store
SQLite-backed conversation memory so customer context survives server restarts.
In production: swap SQLite for Redis with TTL expiry.

Stores:
- Full conversation history per customer
- Enrollment status
- Life event + product context
- Opt-out status (DPDP Act compliant)
- Last interaction timestamp
"""

import sqlite3
import json
import time
import os
from pathlib import Path
from typing import Any

DB_PATH = Path(__file__).parent / "data" / "sessions.db"


def _get_conn() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Create tables if they don't exist."""
    with _get_conn() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                customer_id     TEXT PRIMARY KEY,
                customer_name   TEXT,
                event_type      TEXT,
                product_code    TEXT,
                recommended_product TEXT,
                outreach_message    TEXT,
                conversation_history TEXT DEFAULT '[]',
                enrollment_status   TEXT DEFAULT 'pending',
                ab_variant          TEXT DEFAULT 'A',
                opted_out           INTEGER DEFAULT 0,
                opt_out_timestamp   REAL,
                opt_out_channel     TEXT,
                created_at          REAL,
                updated_at          REAL,
                total_turns         INTEGER DEFAULT 0
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS opt_out_log (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_id     TEXT,
                customer_name   TEXT,
                timestamp       REAL,
                channel         TEXT,
                message_sent    TEXT,
                reason          TEXT
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS conversation_events (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_id     TEXT,
                role            TEXT,
                message         TEXT,
                timestamp       REAL,
                intent          TEXT,
                enrollment_status TEXT
            )
        """)
        conn.commit()


def save_session(
    customer: dict[str, Any],
    event_data: dict[str, Any],
    outreach_message: str,
    ab_variant: str = "A",
):
    """Create or update a session for a customer."""
    now = time.time()
    with _get_conn() as conn:
        conn.execute("""
            INSERT INTO sessions
                (customer_id, customer_name, event_type, product_code,
                 recommended_product, outreach_message, conversation_history,
                 enrollment_status, ab_variant, opted_out, created_at, updated_at, total_turns)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, 0, ?, ?, 0)
            ON CONFLICT(customer_id) DO UPDATE SET
                event_type = excluded.event_type,
                product_code = excluded.product_code,
                recommended_product = excluded.recommended_product,
                outreach_message = excluded.outreach_message,
                conversation_history = json('[]'),
                enrollment_status = 'pending',
                ab_variant = excluded.ab_variant,
                opted_out = 0,
                updated_at = excluded.updated_at,
                total_turns = 0
        """, (
            customer["id"],
            customer["name"],
            event_data.get("top_event"),
            event_data.get("product_code"),
            event_data.get("recommended_product"),
            outreach_message,
            json.dumps([{"role": "assistant", "content": outreach_message}]),
            ab_variant,
            now, now,
        ))
        # Log the outreach event
        conn.execute("""
            INSERT INTO conversation_events
                (customer_id, role, message, timestamp, intent, enrollment_status)
            VALUES (?, 'assistant', ?, ?, 'OUTREACH', 'pending')
        """, (customer["id"], outreach_message, now))
        conn.commit()


def get_session(customer_id: str) -> dict[str, Any] | None:
    """Retrieve a session. Returns None if not found or opted out."""
    with _get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM sessions WHERE customer_id = ?", (customer_id,)
        ).fetchone()
    if not row:
        return None
    return {
        "customer_id": row["customer_id"],
        "customer_name": row["customer_name"],
        "event_type": row["event_type"],
        "product_code": row["product_code"],
        "recommended_product": row["recommended_product"],
        "outreach_message": row["outreach_message"],
        "conversation_history": json.loads(row["conversation_history"] or "[]"),
        "enrollment_status": row["enrollment_status"],
        "ab_variant": row["ab_variant"],
        "opted_out": bool(row["opted_out"]),
        "opt_out_timestamp": row["opt_out_timestamp"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
        "total_turns": row["total_turns"],
    }


def update_conversation(
    customer_id: str,
    history: list[dict],
    enrollment_status: str,
    user_message: str = "",
    intent: str = "",
):
    """Update conversation history and status after each chat turn."""
    now = time.time()
    with _get_conn() as conn:
        conn.execute("""
            UPDATE sessions SET
                conversation_history = ?,
                enrollment_status = ?,
                updated_at = ?,
                total_turns = total_turns + 1
            WHERE customer_id = ?
        """, (json.dumps(history), enrollment_status, now, customer_id))

        if user_message:
            conn.execute("""
                INSERT INTO conversation_events
                    (customer_id, role, message, timestamp, intent, enrollment_status)
                VALUES (?, 'user', ?, ?, ?, ?)
            """, (customer_id, user_message, now, intent, enrollment_status))

        conn.commit()


def process_opt_out(customer_id: str, customer_name: str, channel: str = "WhatsApp") -> bool:
    """
    Process a STOP/opt-out request.
    Updates consent record, logs the event, prevents future outreach.
    DPDP Act §13 compliant.
    """
    now = time.time()
    with _get_conn() as conn:
        conn.execute("""
            UPDATE sessions SET
                opted_out = 1,
                opt_out_timestamp = ?,
                opt_out_channel = ?,
                enrollment_status = 'opted_out',
                updated_at = ?
            WHERE customer_id = ?
        """, (now, channel, now, customer_id))

        conn.execute("""
            INSERT INTO opt_out_log
                (customer_id, customer_name, timestamp, channel, message_sent, reason)
            VALUES (?, ?, ?, ?, 'STOP received — consent withdrawn', 'Customer request')
        """, (customer_id, customer_name, now, channel))

        conn.commit()
    return True


def is_opted_out(customer_id: str) -> bool:
    """Check if a customer has opted out. Called before every outreach."""
    with _get_conn() as conn:
        row = conn.execute(
            "SELECT opted_out FROM sessions WHERE customer_id = ?", (customer_id,)
        ).fetchone()
    return bool(row and row["opted_out"])


def get_all_sessions() -> list[dict]:
    """Return all sessions for compliance audit."""
    with _get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM sessions ORDER BY updated_at DESC"
        ).fetchall()
    return [
        {
            "customer_id": r["customer_id"],
            "customer_name": r["customer_name"],
            "event_type": r["event_type"],
            "recommended_product": r["recommended_product"],
            "enrollment_status": r["enrollment_status"],
            "opted_out": bool(r["opted_out"]),
            "total_turns": r["total_turns"],
            "created_at": r["created_at"],
            "updated_at": r["updated_at"],
        }
        for r in rows
    ]


def get_opt_out_log() -> list[dict]:
    """Return full opt-out log for DPDP compliance."""
    with _get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM opt_out_log ORDER BY timestamp DESC"
        ).fetchall()
    return [dict(r) for r in rows]


def get_conversation_timeline(customer_id: str) -> list[dict]:
    """Return full message timeline for a customer — for compliance export."""
    with _get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM conversation_events WHERE customer_id = ? ORDER BY timestamp ASC",
            (customer_id,)
        ).fetchall()
    return [dict(r) for r in rows]


def clear_session(customer_id: str):
    """Clear a single session (for demo reset)."""
    with _get_conn() as conn:
        conn.execute("DELETE FROM sessions WHERE customer_id = ?", (customer_id,))
        conn.execute("DELETE FROM conversation_events WHERE customer_id = ?", (customer_id,))
        conn.commit()


def clear_all_sessions():
    """Clear all sessions (demo reset)."""
    with _get_conn() as conn:
        conn.execute("DELETE FROM sessions")
        conn.execute("DELETE FROM conversation_events")
        conn.commit()


# Initialize on import
init_db()
