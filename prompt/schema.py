# prompt/schema.py
from dataclasses import dataclass
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

    # Style context
    style_id: str
    visual_constraints: Dict[str, any]

    # Constraints
    negative_constraints: List[str]

    # Extracted elements
    placement: Optional[str] = None  # e.g., "front chest", "back", "sleeve"
    subject_matter: Optional[str] = None  # e.g., "mascot character", "abstract pattern"
    mood: Optional[str] = None  # e.g., "playful", "vintage", "aggressive"
    technique: Optional[str] = None  # e.g., "thick ink lines", "watercolor", "screen print"
    fidelity: Optional[str] = None  # e.g., "rough concept", "final art", "sketch"

    # Technical parameters (model-agnostic)
    composition_notes: Optional[str] = None
    color_guidance: Optional[str] = None

    def to_dict(self) -> Dict:
        """Convert to dictionary for downstream consumption."""
        return {
            "intent": self.intent,
            "refined_intent": self.refined_intent,
            "style_id": self.style_id,
            "visual_constraints": self.visual_constraints,
            "negative_constraints": self.negative_constraints,
            "placement": self.placement,
            "subject_matter": self.subject_matter,
            "mood": self.mood,
            "technique": self.technique,
            "fidelity": self.fidelity,
            "composition_notes": self.composition_notes,
            "color_guidance": self.color_guidance
        }