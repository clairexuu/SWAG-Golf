import json
from pathlib import Path
from typing import List, Optional, Dict
from datetime import datetime

from .types import ImageEmbedding
from .embedder import ImageEmbedder


class StyleImageIndex:
    """
    Manages the embedding index for a single style.
    Handles caching and lazy loading.

    Embeddings must be pre-built using init_embeddings.py before retrieval.
    """

    def __init__(
        self,
        style_id: str,
        style_registry,
        embedder: ImageEmbedder,
        cache_dir: str = "rag/cache"
    ):
        """
        Initialize index for a specific style.

        Args:
            style_id: The style identifier
            style_registry: StyleRegistry instance to access style metadata
            embedder: ImageEmbedder instance for generating embeddings
            cache_dir: Directory for cached embeddings
        """
        self.style_id = style_id
        self.style_registry = style_registry
        self.embedder = embedder
        self.cache_dir = Path(cache_dir)
        self._embeddings: Optional[List[ImageEmbedding]] = None

        # Ensure cache directory exists
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    def get_embeddings(self) -> List[ImageEmbedding]:
        """
        Get embeddings from cache.

        Raises:
            ValueError: If no cache exists for this style.
                Run init_embeddings.py to build the cache first.
        """
        if self._embeddings is None:
            self._embeddings = self._load_from_cache()
        return self._embeddings

    def _load_from_cache(self) -> List[ImageEmbedding]:
        """
        Load embeddings from cache file.

        Raises:
            ValueError: If cache doesn't exist or is invalid.
        """
        cache_path = self._get_cache_path()

        if not cache_path.exists():
            raise ValueError(
                f"No embeddings cache for style '{self.style_id}'. "
                f"Run: python -m rag.init_embeddings --style {self.style_id}"
            )

        try:
            return self._parse_cache_file(cache_path)
        except json.JSONDecodeError as e:
            raise ValueError(
                f"Corrupted cache for style '{self.style_id}': {e}. "
                f"Run: python -m rag.init_embeddings --style {self.style_id} --force"
            )

    def build_index(self) -> List[ImageEmbedding]:
        """Generate embeddings for all reference images in style"""
        style = self.style_registry.get_style(self.style_id)

        if not style.reference_images:
            print(f"Warning: Style {self.style_id} has no reference images")
            return []

        embeddings = []
        for img_path in style.reference_images:
            # Generate embedding
            embedding_vector = self.embedder.embed_image(img_path)

            # Create ImageEmbedding object
            img_embedding = ImageEmbedding(
                image_path=img_path,
                embedding=embedding_vector,
                style_id=self.style_id
            )
            embeddings.append(img_embedding)

        # Cache the results
        self._save_to_cache(embeddings)

        return embeddings

    def _get_cache_path(self) -> Path:
        """Get cache file path for this style"""
        return self.cache_dir / f"{self.style_id}_embeddings.json"

    def _save_to_cache(self, embeddings: List[ImageEmbedding]) -> None:
        """Persist embeddings to cache file"""
        cache_data = {
            "style_id": self.style_id,
            "embedding_dim": self.embedder.embedding_dim,
            "created_at": datetime.now().isoformat(),
            "embeddings": [
                {
                    "image_path": emb.image_path,
                    "embedding": emb.embedding,
                    "style_id": emb.style_id
                }
                for emb in embeddings
            ]
        }

        cache_path = self._get_cache_path()
        with open(cache_path, 'w') as f:
            json.dump(cache_data, f, indent=2)

    def _parse_cache_file(self, cache_path: Path) -> List[ImageEmbedding]:
        """Parse and validate cache file contents."""
        with open(cache_path, 'r') as f:
            cache_data = json.load(f)

        # Validate embedding dimension
        if cache_data.get("embedding_dim") != self.embedder.embedding_dim:
            raise ValueError(
                f"Cached embedding dimension {cache_data.get('embedding_dim')} "
                f"does not match embedder dimension {self.embedder.embedding_dim}. "
                f"Run: python -m rag.init_embeddings --style {self.style_id} --force"
            )

        embeddings = [
            ImageEmbedding(
                image_path=emb_data["image_path"],
                embedding=emb_data["embedding"],
                style_id=emb_data["style_id"]
            )
            for emb_data in cache_data["embeddings"]
        ]

        return embeddings

    def clear_cache(self) -> None:
        """Remove cached embeddings for this style"""
        cache_path = self._get_cache_path()
        if cache_path.exists():
            cache_path.unlink()
        self._embeddings = None


class IndexRegistry:
    """
    Registry for accessing style-specific indices.
    Follows the registry pattern similar to StyleRegistry.
    """

    def __init__(self, style_registry, embedder: ImageEmbedder, cache_dir: str = "rag/cache"):
        """
        Initialize the index registry.

        Args:
            style_registry: StyleRegistry instance
            embedder: ImageEmbedder instance
            cache_dir: Directory for cached embeddings
        """
        self.style_registry = style_registry
        self.embedder = embedder
        self.cache_dir = cache_dir
        self._indices: Dict[str, StyleImageIndex] = {}

    def get_index(self, style_id: str) -> StyleImageIndex:
        """
        Get or create index for a specific style.

        Args:
            style_id: The style identifier

        Returns:
            StyleImageIndex for the requested style
        """
        if style_id not in self._indices:
            self._indices[style_id] = StyleImageIndex(
                style_id=style_id,
                style_registry=self.style_registry,
                embedder=self.embedder,
                cache_dir=self.cache_dir
            )
        return self._indices[style_id]

    def rebuild_all(self) -> None:
        """Rebuild all style indices"""
        all_styles = self.style_registry.list_styles()
        for style_id in all_styles:
            print(f"Rebuilding index for {style_id}...")
            index = self.get_index(style_id)
            index.build_index()

    def clear_cache(self) -> None:
        """Clear all cached embeddings"""
        for index in self._indices.values():
            index.clear_cache()
        self._indices.clear()
