# Feedback & Learning Loop

Designer submits free-text feedback after viewing generated sketches to improve future generations.

- Feedback is per-style: resets when switching styles
- Two levels: in-session (short-term) and persistent style learning (long-term)

## Two-Level Feedback

### In-Session (Short-Term)

Feedback stored as conversation turns in an in-memory `SessionStore`, keyed by `session_id::style_id`. On the next generation, full conversation history is injected into the prompt compiler's GPT call, improving both RAG retrieval and image generation.

### Persistent (Long-Term)

When summarization is triggered, GPT condenses all feedback into a summary (under 200 words) and saves it to `style.json` as `feedback_summary`. Included in style context as `learned_preferences` for all future generations.

**Summarization triggers:**
- User switches to a different style
- 10 consecutive feedbacks (auto-triggered)
- User closes/leaves the app (`beforeunload` via `navigator.sendBeacon`)

## Implementation

### Data Types (`feedback/session.py`)

**ConversationTurn**
```python
@dataclass
class ConversationTurn:
    turn_number: int
    role: str              # "generate" or "feedback"
    timestamp: str
    user_input: str
    style_id: str
    # Generate-only
    refined_intent: Optional[str]
    negative_constraints: Optional[List[str]]
    image_paths: Optional[List[str]]
```

**ConversationContext**
- `add_turn()` - Append a turn
- `to_gpt_messages()` - Convert history to OpenAI chat format
- `feedback_count` - Number of feedback turns (used for 10-feedback threshold)
- `get_feedback_texts()` - Extract all feedback strings for summarization

**SessionStore** — in-memory dict keyed by `"{session_id}::{style_id}"`, with `get_or_create()` and `reset()`.

### Style Extension (`style/types.py`)

```python
@dataclass
class Style:
    # ... existing fields ...
    feedback_summary: Optional[str] = None  # GPT-summarized designer feedback
```

Persisted in `style.json` as `feedback_summary`. Read by `StyleRegistry.get_style()`.

### Pipeline Service (`api/services/pipeline.py`)

- `generate()` - Accepts `session_id`, passes conversation history to prompt compiler, records a generate turn
- `add_feedback(session_id, style_id, feedback)` - Records feedback turn, logs to JSONL, auto-triggers summarization at 10 feedbacks
- `summarize_feedback(session_id, style_id)` - GPT-summarizes feedback, merges with existing summary, persists to `style.json`, clears session

### JSONL Logging (`feedback/logger.py`)

Each turn appended to `logs/conversations/{date}.jsonl` with session ID, style ID, and full turn data.

### Directory Structure

```
feedback/
├── __init__.py             # Module exports
├── session.py              # ConversationTurn, ConversationContext, SessionStore
├── logger.py               # JSONL logger
└── logs/conversations/
    └── {date}.jsonl        # Daily feedback logs

style/style_library/{style_id}/
└── style.json              # Includes feedback_summary field
```
