# style/types.py
from dataclasses import dataclass, field
from typing import List, Optional

@dataclass
class VisualRules:
    """Visual characteristics that define a style's appearance"""
    line_weight: str  # e.g., "thick", "thin", "variable"
    looseness: str    # e.g., "tight", "loose", "gestural"
    complexity: str   # e.g., "minimal", "moderate", "detailed"
    additional_rules: dict = field(default_factory=dict)

@dataclass
class Style:
    """Represents a discrete design style with its associated metadata and rules"""
    id: str
    name: str
    description: str
    visual_rules: VisualRules
    reference_images: List[str] = field(default_factory=list)  # Paths to curated reference images
    do_not_use: Optional[List[str]] = field(default_factory=list)  # Paths to excluded reference images