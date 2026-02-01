# generate/types.py
import os
from dataclasses import dataclass, field
from typing import List, Optional, Dict, Tuple
from prompt.schema import PromptSpec
from rag.types import RetrievalResult


@dataclass
class GenerationConfig:
    """Configuration for image generation"""
    num_images: int = 4  # Generate 3-6 sketches
    resolution: Tuple[int, int] = (1050, 1875)  # Width x Height (used for placeholders)
    output_dir: str = "generated_outputs"  # Base output directory
    model_name: str = field(default_factory=lambda: os.getenv('GEMINI_MODEL', 'gemini-2.5-flash-image'))  # Model identifier from env
    seed: Optional[int] = None  # For reproducibility
    aspect_ratio: str = "9:16"  # Gemini aspect ratio preset (9:16 for portrait ~1050x1875)
    image_size: str = "2K"  # Gemini image size preset ("1K", "2K", "4K")


@dataclass
class GenerationResult:
    """Result of image generation containing paths and metadata"""
    images: List[str]  # Paths to generated images
    metadata_path: str  # Path to metadata JSON
    timestamp: str  # Generation timestamp
    prompt_spec: PromptSpec  # From prompt/schema.py
    reference_images: List[str]  # From RAG retrieval
    config: GenerationConfig  # Configuration used

    def to_dict(self) -> Dict:
        """Convert to dictionary for serialization"""
        return {
            "images": self.images,
            "metadata_path": self.metadata_path,
            "timestamp": self.timestamp,
            "prompt_spec": self.prompt_spec.to_dict(),
            "reference_images": self.reference_images,
            "config": {
                "num_images": self.config.num_images,
                "resolution": list(self.config.resolution),
                "output_dir": self.config.output_dir,
                "model_name": self.config.model_name,
                "seed": self.config.seed,
                "aspect_ratio": self.config.aspect_ratio,
                "image_size": self.config.image_size
            }
        }


@dataclass
class GenerationPayload:
    """Standardized input payload for image generation"""
    prompt_spec: PromptSpec  # Compiled prompt
    retrieval_result: RetrievalResult  # RAG references
    config: GenerationConfig  # Generation parameters
    style: object  # Style object with name, description, visual_rules
