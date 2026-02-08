"""JSONL logger for conversation feedback turns."""

import json
from datetime import datetime
from pathlib import Path
from typing import Dict, Any


class ConversationLogger:
    """Appends conversation turns to a JSONL log file for designer review."""

    def __init__(self, log_dir: str = "feedback/logs/conversations"):
        self.log_dir = Path(log_dir)
        self.log_dir.mkdir(parents=True, exist_ok=True)

    def log_turn(self, session_id: str, style_id: str, turn_data: Dict[str, Any]) -> None:
        """Append one JSONL line per turn, partitioned by date."""
        today = datetime.utcnow().strftime("%Y-%m-%d")
        log_file = self.log_dir / f"{today}.jsonl"

        entry = {
            "session_id": session_id,
            "style_id": style_id,
            "logged_at": datetime.utcnow().isoformat(),
            **turn_data
        }

        with open(log_file, "a") as f:
            f.write(json.dumps(entry) + "\n")
