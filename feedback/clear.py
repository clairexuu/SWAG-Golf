#!/usr/bin/env python3
"""Clear all feedback logs and feedback_summary fields for testing."""

import json
import shutil
from pathlib import Path

LOGS_DIR = Path("feedback/logs/conversations")
STYLE_LIBRARY = Path("style/style_library")


def clear_logs():
    """Delete all JSONL log files."""
    if not LOGS_DIR.exists():
        print("No logs directory found.")
        return

    files = list(LOGS_DIR.glob("*.jsonl"))
    for f in files:
        f.unlink()
    print(f"Deleted {len(files)} log file(s) from {LOGS_DIR}")


def clear_feedback_summaries():
    """Remove feedback_summary from all style.json files."""
    if not STYLE_LIBRARY.exists():
        print("No style library found.")
        return

    count = 0
    for style_json in STYLE_LIBRARY.glob("*/style.json"):
        with open(style_json) as f:
            data = json.load(f)

        if "feedback_summary" in data:
            del data["feedback_summary"]
            with open(style_json, "w") as f:
                json.dump(data, f, indent=2)
                f.write("\n")
            count += 1
            print(f"  Cleared feedback_summary from {style_json}")

    if count == 0:
        print("No styles had feedback_summary set.")
    else:
        print(f"Cleared feedback_summary from {count} style(s).")


if __name__ == "__main__":
    print("=== Clearing feedback data ===\n")
    clear_logs()
    print()
    clear_feedback_summaries()
    print("\nDone.")
