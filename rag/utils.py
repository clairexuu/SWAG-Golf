import math
from typing import List
from pathlib import Path


def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """
    Compute cosine similarity between two vectors.
    Returns a value between -1 and 1, where 1 means identical direction.
    """
    if not vec1 or not vec2 or len(vec1) != len(vec2):
        return 0.0

    dot_product = sum(a * b for a, b in zip(vec1, vec2))
    norm1 = math.sqrt(sum(a * a for a in vec1))
    norm2 = math.sqrt(sum(b * b for b in vec2))

    if norm1 == 0 or norm2 == 0:
        return 0.0

    return dot_product / (norm1 * norm2)


def validate_image_path(image_path: str) -> bool:
    """Check if image path exists and has valid image extension"""
    path = Path(image_path)
    valid_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'}
    return path.exists() and path.suffix.lower() in valid_extensions


def normalize_vector(vec: List[float]) -> List[float]:
    """Normalize a vector to unit length"""
    norm = math.sqrt(sum(x * x for x in vec))
    if norm == 0:
        return vec
    return [x / norm for x in vec]
