from typing import List, Optional

from .types import ReferenceImage, RetrievalResult, RetrievalConfig
from .index import IndexRegistry
from .utils import cosine_similarity


class ImageRetriever:
    """
    Main retrieval engine that combines style filtering and semantic search.
    """

    def __init__(
        self,
        index_registry: IndexRegistry,
        config: Optional[RetrievalConfig] = None
    ):
        """
        Initialize the image retriever.

        Args:
            index_registry: IndexRegistry for accessing style-specific embeddings
            config: Configuration for retrieval behavior
        """
        self.index_registry = index_registry
        self.config = config or RetrievalConfig()

    def retrieve(self, prompt_spec, top_k: Optional[int] = None) -> RetrievalResult:
        """
        Retrieve reference images for a compiled prompt.

        Flow:
        1. Extract style_id from prompt_spec
        2. Hard-filter to only that style's images
        3. Compute query embedding from prompt_spec (PLACEHOLDER: uses first image)
        4. Rank by semantic similarity
        5. Return top-K results

        Args:
            prompt_spec: PromptSpec object with style_id and prompt details
            top_k: Number of images to retrieve (overrides config)

        Returns:
            RetrievalResult with retrieved images and scores
        """
        k = top_k or self.config.top_k
        style_id = prompt_spec.style_id

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

        # TODO: Compute query embedding from prompt_spec
        # For now, use the first image's embedding as a proxy query
        # In the future, this should use text→embedding or multi-modal embedding
        # query_embedding = embed_text(prompt_spec.refined_intent)
        query_embedding = embeddings[0].embedding

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
            style = self.index_registry.style_registry.get_style(style_id)
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

    def retrieve_by_text(
        self,
        text: str,
        style_id: str,
        top_k: Optional[int] = None
    ) -> RetrievalResult:
        """
        Retrieve reference images by text query and style.

        PLACEHOLDER: Currently uses same logic as retrieve() with proxy query.
        In the future, this should directly embed the text query.

        Args:
            text: Text description for retrieval
            style_id: Style to filter by
            top_k: Number of images to retrieve

        Returns:
            RetrievalResult with retrieved images and scores

        TODO: Implement text→embedding:
        # query_embedding = self.embedder.embed_text(text)
        # Then use query_embedding for similarity computation
        """
        k = top_k or self.config.top_k

        # Hard filter: get only this style's index
        style_index = self.index_registry.get_index(style_id)
        embeddings = style_index.get_embeddings()

        if not embeddings:
            return RetrievalResult(
                images=[],
                scores=[],
                query_context={
                    "style_id": style_id,
                    "text_query": text,
                    "top_k": k
                }
            )

        # TODO: Replace with actual text embedding
        query_embedding = embeddings[0].embedding

        # Compute similarities
        scores = [
            cosine_similarity(query_embedding, emb.embedding)
            for emb in embeddings
        ]

        # Rank and select top-K
        ranked = sorted(
            zip(scores, embeddings),
            key=lambda x: x[0],
            reverse=True
        )[:k]

        # Build result
        result_images = [
            ReferenceImage(
                path=emb.image_path,
                style_id=emb.style_id,
                embedding=emb.embedding,
                metadata={}
            )
            for _, emb in ranked
        ]
        result_scores = [score for score, _ in ranked]

        return RetrievalResult(
            images=result_images,
            scores=result_scores,
            query_context={
                "style_id": style_id,
                "text_query": text,
                "top_k": k,
                "total_candidates": len(embeddings)
            }
        )
