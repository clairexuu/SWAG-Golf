from typing import List, Optional

from .types import ReferenceImage, RetrievalResult, RetrievalConfig
from .index import IndexRegistry
from .embedder import ImageEmbedder
from .utils import cosine_similarity


class ImageRetriever:
    """
    Main retrieval engine that combines style filtering and semantic search.
    """

    def __init__(
        self,
        index_registry: IndexRegistry,
        embedder: ImageEmbedder,
        config: Optional[RetrievalConfig] = None
    ):
        """
        Initialize the image retriever.

        Args:
            index_registry: IndexRegistry for accessing style-specific embeddings
            embedder: ImageEmbedder instance for generating query embeddings
            config: Configuration for retrieval behavior
        """
        self.index_registry = index_registry
        self.embedder = embedder
        self.config = config or RetrievalConfig()

    def retrieve(self, prompt_spec, style, top_k: Optional[int] = None) -> RetrievalResult:
        """
        Retrieve reference images for a compiled prompt.

        Flow:
        1. Extract style_id from style object
        2. Hard-filter to only that style's images
        3. Compute query embedding from prompt_spec (PLACEHOLDER: uses first image)
        4. Rank by semantic similarity
        5. Return top-K results

        Args:
            prompt_spec: PromptSpec object with prompt details
            style: Style object for filtering images
            top_k: Number of images to retrieve (overrides config)

        Returns:
            RetrievalResult with retrieved images and scores
        """
        k = top_k or self.config.top_k
        style_id = style.id

        # Hard filter: get only this style's index
        style_index = self.index_registry.get_index(style_id)
        embeddings = style_index.get_embeddings()

        if not embeddings:
            return RetrievalResult(
                images=[],
                scores=[],
                query_context={
                    "style_id": style_id,
                    "intent": prompt_spec.intent,
                    "top_k": k
                }
            )

        # Generate query embedding from text description
        # Use refined_intent (GPT-normalized), fallback to intent if empty
        query_text = prompt_spec.refined_intent
        if not query_text or not query_text.strip():
            print(f"Warning: refined_intent is empty in prompt_spec, using original intent")
            query_text = prompt_spec.intent

        # Embed the query text using the model's text encoder
        query_embedding = self.embedder.embed_text(query_text)

        # Compute similarities
        scores = [
            cosine_similarity(query_embedding, emb.embedding)
            for emb in embeddings
        ]

        # Rank and filter
        ranked = sorted(
            zip(scores, embeddings),
            key=lambda x: x[0],
            reverse=True
        )

        # Apply minimum similarity threshold
        filtered = [
            (score, emb) for score, emb in ranked
            if score >= self.config.min_similarity
        ]

        # Get top-K results
        top_results = filtered[:k]

        # Filter out "do_not_use" images if configured
        if not self.config.include_negative:
            do_not_use = set(style.do_not_use) if style.do_not_use else set()
            top_results = [
                (score, emb) for score, emb in top_results
                if emb.image_path not in do_not_use
            ]

        # Build RetrievalResult
        result_images = [
            ReferenceImage(
                path=emb.image_path,
                style_id=emb.style_id,
                embedding=emb.embedding,
                metadata={}
            )
            for _, emb in top_results
        ]
        result_scores = [score for score, _ in top_results]

        return RetrievalResult(
            images=result_images,
            scores=result_scores,
            query_context={
                "style_id": style_id,
                "intent": prompt_spec.intent,
                "refined_intent": prompt_spec.refined_intent,
                "top_k": k,
                "total_candidates": len(embeddings)
            }
        )