"""Session management for conversational feedback."""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional, Any


@dataclass
class ConversationTurn:
    """A single turn in a conversation session."""
    turn_number: int
    role: str  # "generate" or "feedback"
    timestamp: str
    user_input: str
    style_id: str

    # Generate-only fields
    refined_intent: Optional[str] = None
    negative_constraints: Optional[List[str]] = None
    image_paths: Optional[List[str]] = None

    def to_dict(self) -> Dict[str, Any]:
        d = {
            "turn_number": self.turn_number,
            "role": self.role,
            "timestamp": self.timestamp,
            "user_input": self.user_input,
            "style_id": self.style_id,
        }
        if self.role == "generate":
            d["refined_intent"] = self.refined_intent
            d["negative_constraints"] = self.negative_constraints
            d["image_paths"] = self.image_paths
        return d


@dataclass
class ConversationContext:
    """Full conversation history for one session+style pair."""
    session_id: str
    style_id: str
    turns: List[ConversationTurn] = field(default_factory=list)
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())

    @property
    def turn_count(self) -> int:
        return len(self.turns)

    @property
    def feedback_count(self) -> int:
        return sum(1 for t in self.turns if t.role == "feedback")

    def add_turn(self, turn: ConversationTurn) -> None:
        self.turns.append(turn)

    def to_gpt_messages(self) -> List[Dict[str, str]]:
        """Convert history into OpenAI chat message format."""
        messages = []
        for turn in self.turns:
            if turn.role == "generate":
                messages.append({
                    "role": "user",
                    "content": f"[Generation Request] {turn.user_input}"
                })
                messages.append({
                    "role": "assistant",
                    "content": (
                        f"[Compiled Prompt]\n"
                        f"Refined intent: {turn.refined_intent}\n"
                        f"Negative constraints: {', '.join(turn.negative_constraints or [])}\n"
                        f"Generated images: {', '.join(f'Image {i+1}' for i in range(len(turn.image_paths or [])))}"
                    )
                })
            elif turn.role == "feedback":
                messages.append({
                    "role": "user",
                    "content": f"[Feedback] {turn.user_input}"
                })
        return messages

    def get_feedback_texts(self) -> List[str]:
        """Get all feedback texts from this session."""
        return [t.user_input for t in self.turns if t.role == "feedback"]


class SessionStore:
    """In-memory session state, keyed by (session_id, style_id)."""

    def __init__(self):
        self._sessions: Dict[str, ConversationContext] = {}

    def _key(self, session_id: str, style_id: str) -> str:
        return f"{session_id}::{style_id}"

    def get_or_create(self, session_id: str, style_id: str) -> ConversationContext:
        key = self._key(session_id, style_id)
        if key not in self._sessions:
            self._sessions[key] = ConversationContext(
                session_id=session_id,
                style_id=style_id
            )
        return self._sessions[key]

    def reset(self, session_id: str, style_id: str) -> None:
        key = self._key(session_id, style_id)
        self._sessions.pop(key, None)
