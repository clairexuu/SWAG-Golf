from dataclasses import dataclass, field
from typing import List, Optional, Dict


@dataclass
class ReferenceImage:
    """Represents a reference image in the style library"""
    path: str
    style_id: str
    embedding: Optional[List[float]] = None
    metadata: Dict = field(default_factory=dict)


@dataclass
class ImageEmbedding:
    """Stores an image embedding with its metadata"""
    image_path: str
    embedding: List[float]
    style_id: str


@dataclass
class RetrievalResult:
    """Result of a retrieval query"""
    images: List[ReferenceImage]
    scores: List[float]
    query_context: Dict

    def to_dict(self) -> Dict:
        """Convert to dictionary for downstream consumption"""
        return {
            "images": [img.path for img in self.images],
            "scores": self.scores,
            "query_context": self.query_context
        }


@dataclass
class RetrievalConfig:
    """Configuration for retrieval behavior"""
    top_k: int = 5
    min_similarity: float = 0.0
    include_negative: bool = False
