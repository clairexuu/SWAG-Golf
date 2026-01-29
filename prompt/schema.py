# prompt/schema.py
from dataclasses import dataclass, field
from typing import List, Dict, Optional

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

    # Extracted elements
    placement: Optional[str] = None         # "front chest", "back", "sleeve", ...
    subject_matter: Optional[str] = None    # "mascot character", "abstract pattern", ...
    mood: Optional[str] = None              # "playful", "vintage", "aggressive", ...
    perspective: Optional[str] = None       # "3/4 view", "side view", "from above", ...

    # Technical parameters (model-agnostic)
    composition_notes: Optional[str] = None

    def to_dict(self) -> Dict:
        """Convert to dictionary for downstream consumption."""
        return {
            "intent": self.intent,
            "refined_intent": self.refined_intent,
            "negative_constraints": self.negative_constraints,
            "placement": self.placement,
            "subject_matter": self.subject_matter,
            "mood": self.mood,
            "perspective": self.perspective,
            "composition_notes": self.composition_notes
        }