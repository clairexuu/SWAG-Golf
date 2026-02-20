# generate/generator.py
from typing import AsyncGenerator, List, Optional, Tuple
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
        image_paths, image_errors = self.adapter.generate(payload)

        # Get timestamp for this generation
        timestamp = get_timestamp()

        # Extract reference image paths
        reference_images = retrieval_result.to_dict()["images"]

        # Create GenerationResult
        result = GenerationResult(
            images=image_paths,
            image_errors=image_errors,
            metadata_path="",  # Will be set after saving metadata
            timestamp=timestamp,
            prompt_spec=prompt_spec,
            reference_images=reference_images,
            config=config
        )

        # Save metadata
        # Extract output directory from first successful image path
        successful_paths = [p for p in image_paths if p is not None]
        if successful_paths:
            import os
            output_dir = os.path.dirname(successful_paths[0])

            # Prepare metadata dictionary
            metadata_dict = {
                "timestamp": timestamp,
                "archived": False,
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
                "images": [os.path.basename(p) for p in successful_paths],
                "image_errors": [e for e in image_errors if e is not None]
            }

            # Save metadata
            metadata_path = save_metadata(metadata_dict, output_dir)
            result.metadata_path = metadata_path

        return result

    async def generate_async(
        self,
        prompt_spec: PromptSpec,
        retrieval_result: RetrievalResult,
        style,
        config: Optional[GenerationConfig] = None
    ) -> GenerationResult:
        """Async version of generate()."""
        if config is None:
            config = GenerationConfig()

        payload = GenerationPayload(
            prompt_spec=prompt_spec,
            retrieval_result=retrieval_result,
            config=config,
            style=style
        )

        image_paths, image_errors = await self.adapter.generate_async(payload)

        timestamp = get_timestamp()
        reference_images = retrieval_result.to_dict()["images"]

        result = GenerationResult(
            images=image_paths,
            image_errors=image_errors,
            metadata_path="",
            timestamp=timestamp,
            prompt_spec=prompt_spec,
            reference_images=reference_images,
            config=config
        )

        successful_paths = [p for p in image_paths if p is not None]
        if successful_paths:
            import os
            output_dir = os.path.dirname(successful_paths[0])
            metadata_dict = {
                "timestamp": timestamp,
                "archived": False,
                "user_prompt": prompt_spec.intent,
                "gpt_compiled_prompt": prompt_spec.refined_intent,
                "style": {"id": style.id, "name": style.name},
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
                "images": [os.path.basename(p) for p in successful_paths],
                "image_errors": [e for e in image_errors if e is not None]
            }
            metadata_path = save_metadata(metadata_dict, output_dir)
            result.metadata_path = metadata_path

        return result

    async def generate_streaming_async(
        self,
        prompt_spec: PromptSpec,
        retrieval_result: RetrievalResult,
        style,
        config: Optional[GenerationConfig] = None,
        on_retry=None
    ) -> AsyncGenerator[Tuple[int, Optional[str], Optional[str]], None]:
        """Async streaming generator that yields (index, image_path, error) as each image completes."""
        if config is None:
            config = GenerationConfig()

        payload = GenerationPayload(
            prompt_spec=prompt_spec,
            retrieval_result=retrieval_result,
            config=config,
            style=style
        )

        async for idx, path, error in self.adapter.generate_streaming_async(payload, on_retry=on_retry):
            yield (idx, path, error)

    async def refine_streaming_async(
        self,
        refine_prompt: str,
        original_context: str,
        refine_history: List[str],
        source_image_paths: List[str],
        style,
        config: Optional[GenerationConfig] = None,
        on_retry=None
    ) -> AsyncGenerator[Tuple[int, Optional[str], Optional[str]], None]:
        """Async streaming refine that yields (index, image_path, error) as each image completes."""
        if config is None:
            config = GenerationConfig(num_images=len(source_image_paths))

        async for idx, path, error in self.adapter.refine_streaming_async(
            refine_prompt=refine_prompt,
            original_context=original_context,
            refine_history=refine_history,
            source_image_paths=source_image_paths,
            config=config,
            on_retry=on_retry
        ):
            yield (idx, path, error)

    def refine(
        self,
        refine_prompt: str,
        original_context: str,
        refine_history: List[str],
        source_image_paths: List[str],
        style,
        config: Optional[GenerationConfig] = None,
    ) -> GenerationResult:
        """
        Refine existing sketch images by applying modification instructions.

        Args:
            refine_prompt: User's modification instructions
            original_context: Original GPT-compiled refined_intent
            refine_history: Previous refine prompts in order (for chaining)
            source_image_paths: Absolute paths to sketches to modify
            style: Style object
            config: Optional generation config

        Returns:
            GenerationResult containing refined image paths and metadata
        """
        if config is None:
            config = GenerationConfig(num_images=len(source_image_paths))

        # Refine images via adapter
        image_paths, image_errors = self.adapter.refine(
            refine_prompt=refine_prompt,
            original_context=original_context,
            refine_history=refine_history,
            source_image_paths=source_image_paths,
            config=config,
        )

        timestamp = get_timestamp()

        # Build a PromptSpec for metadata recording
        prompt_spec = PromptSpec(
            intent=refine_prompt,
            refined_intent=original_context,
        )

        result = GenerationResult(
            images=image_paths,
            image_errors=image_errors,
            metadata_path="",
            timestamp=timestamp,
            prompt_spec=prompt_spec,
            reference_images=source_image_paths,
            config=config,
        )

        # Save metadata
        successful_paths = [p for p in image_paths if p is not None]
        if successful_paths:
            import os
            output_dir = os.path.dirname(successful_paths[0])

            metadata_dict = {
                "timestamp": timestamp,
                "archived": False,
                "mode": "refine",
                "refine_prompt": refine_prompt,
                "original_context": original_context,
                "refine_history": refine_history,
                "source_images": source_image_paths,
                "style": {
                    "id": style.id,
                    "name": style.name,
                },
                "config": {
                    "num_images": config.num_images,
                    "resolution": list(config.resolution),
                    "model_name": config.model_name,
                    "aspect_ratio": config.aspect_ratio,
                },
                "images": [os.path.basename(p) for p in successful_paths],
                "image_errors": [e for e in image_errors if e is not None],
            }

            metadata_path = save_metadata(metadata_dict, output_dir)
            result.metadata_path = metadata_path

        return result
