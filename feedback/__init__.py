# feedback/__init__.py
"""
Feedback & Learning Loop Module

Manages conversational feedback sessions and persistent logging.
Feedback improves future generations through in-session conversation
context (short-term) and GPT summarization persisted to style.json (long-term).

Key Components:
- ConversationTurn: A single turn (generate or feedback) in a session
- ConversationContext: Full conversation history for a session+style pair
- SessionStore: In-memory session state keyed by (session_id, style_id)
- ConversationLogger: JSONL logger for conversation turns
"""

from .session import ConversationTurn, ConversationContext, SessionStore
from .logger import ConversationLogger

__all__ = [
    "ConversationTurn",
    "ConversationContext",
    "SessionStore",
    "ConversationLogger",
]
