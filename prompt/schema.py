# prompt/schema.py
from dataclasses import dataclass, field
from typing import List, Dict

@dataclass
class PromptSpec:
    """
    Model-agnostic prompt specification for image generation.
    Output of the prompt compilation layer.
    """
    # Core intent
    intent: str  # Original designer input (preserved)
    refined_intent: str  # Normalized/interpreted version

    # Constraints
    negative_constraints: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict:
        """Convert to dictionary for downstream consumption."""
        return {
            "intent": self.intent,
            "refined_intent": self.refined_intent,
            "negative_constraints": self.negative_constraints
        }