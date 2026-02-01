# generate/generator.py
from typing import Optional
from .adapter import ImageModelAdapter
from .nano_banana import NanaBananaAdapter
from .types import GenerationConfig, GenerationResult, GenerationPayload
from .utils import save_metadata, get_timestamp
from prompt.schema import PromptSpec
from rag.types import RetrievalResult


class ImageGenerator:
    """
    Main orchestrator for image generation.
    Provides high-level interface for generating concept sketches.
    """

    def __init__(self, adapter: Optional[ImageModelAdapter] = None):
        """
        Initialize image generator with specified adapter.

        Args:
            adapter: ImageModelAdapter implementation (defaults to NanaBananaAdapter)
        """
        self.adapter = adapter or NanaBananaAdapter()

    def generate(
        self,
        prompt_spec: PromptSpec,
        retrieval_result: RetrievalResult,
        style,
        config: Optional[GenerationConfig] = None
    ) -> GenerationResult:
        """
        Generate concept sketch images.

        This is the main entry point for image generation. It orchestrates:
        1. Payload preparation
        2. Configuration validation
        3. Image generation via adapter
        4. Metadata saving
        5. Result packaging

        Args:
            prompt_spec: Compiled prompt from prompt compiler
            retrieval_result: Retrieved reference images from RAG
            config: Optional generation config (uses defaults if not provided)

        Returns:
            GenerationResult containing image paths, metadata, and configuration
        """
        # Use default config if not provided
        if config is None:
            config = GenerationConfig()

        # Create generation payload
        payload = GenerationPayload(
            prompt_spec=prompt_spec,
            retrieval_result=retrieval_result,
            config=config,
            style=style
        )

        # Generate images via adapter
        image_paths = self.adapter.generate(payload)

        # Get timestamp for this generation
        timestamp = get_timestamp()

        # Extract reference image paths
        reference_images = retrieval_result.to_dict()["images"]

        # Create GenerationResult
        result = GenerationResult(
            images=image_paths,
            metadata_path="",  # Will be set after saving metadata
            timestamp=timestamp,
            prompt_spec=prompt_spec,
            reference_images=reference_images,
            config=config
        )

        # Save metadata
        # Extract output directory from first image path
        if image_paths:
            import os
            output_dir = os.path.dirname(image_paths[0])

            # Prepare metadata dictionary
            metadata_dict = {
                "timestamp": timestamp,
                "user_prompt": prompt_spec.intent,
                "gpt_compiled_prompt": prompt_spec.refined_intent,
                "style": {
                    "id": style.id,
                    "name": style.name
                },
                "prompt_spec": prompt_spec.to_dict(),
                "reference_images": reference_images,
                "retrieval_scores": retrieval_result.scores,
                "config": {
                    "num_images": config.num_images,
                    "resolution": list(config.resolution),
                    "model_name": config.model_name,
                    "seed": config.seed,
                    "aspect_ratio": config.aspect_ratio,
                    "image_size": config.image_size
                },
                "images": [os.path.basename(p) for p in image_paths]  # Just filenames
            }

            # Save metadata
            metadata_path = save_metadata(metadata_dict, output_dir)
            result.metadata_path = metadata_path

        return result
