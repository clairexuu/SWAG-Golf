# style/types.py
from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any

@dataclass
class Style:
    """Represents a discrete design style with its associated metadata and rules"""
    id: str
    name: str
    description: str
    visual_rules: Dict[str, Any]  # Visual constraints (line_weight, looseness, complexity, etc.)
    reference_images: List[str] = field(default_factory=list)  # Paths to curated reference images
    do_not_use: Optional[List[str]] = field(default_factory=list)  # Paths to excluded reference images