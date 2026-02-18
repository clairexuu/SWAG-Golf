# generate/nano_banana.py
import os
from typing import List, Optional, Tuple
from pathlib import Path
from dotenv import load_dotenv
from .adapter import ImageModelAdapter
from .types import GenerationPayload, GenerationConfig
from .utils import get_timestamp, create_output_directory, convert_to_grayscale
from .nano_banana_client import NanaBananaClient


class NanaBananaAdapter(ImageModelAdapter):
    """
    Nano Banana model adapter with placeholder implementation.

    PLACEHOLDER: This currently generates blank grayscale images for demo purposes.
    For production, replace _generate_images() with actual Nano Banana API calls.
    """

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Nano Banana adapter with API client.

        Args:
            api_key: Optional API key (defaults to environment variable)
        """
        load_dotenv()
        try:
            self.client = NanaBananaClient(api_key=api_key)
            print("[OK] Nano Banana client initialized")
        except ValueError as e:
            print(f"WARNING: {e}")
            print("Will use placeholder images")
            self.client = None

    def validate_config(self, config: GenerationConfig) -> bool:
        """
        Validate generation configuration.

        Args:
            config: GenerationConfig to validate

        Returns:
            True if valid

        Raises:
            ValueError: If configuration is invalid
        """
        # Validate num_images (should be 3-6 for sketch generation)
        if config.num_images < 3 or config.num_images > 6:
            raise ValueError(f"num_images must be between 3 and 6, got {config.num_images}")

        # Validate resolution
        width, height = config.resolution
        if width <= 0 or height <= 0:
            raise ValueError(f"Invalid resolution: {config.resolution}")

        return True

    def generate(self, payload: GenerationPayload) -> Tuple[List[Optional[str]], List[Optional[str]]]:
        """
        Generate sketch images using Nano Banana.

        Args:
            payload: GenerationPayload with prompt, references, and config

        Returns:
            Tuple of (image_paths, image_errors). For each index:
              - Success: paths[i] = file path, errors[i] = None
              - Failure: paths[i] = None, errors[i] = error message
        """
        # Validate config
        self.validate_config(payload.config)

        # Format prompt for Nano Banana
        prompt = self.format_prompt(payload.prompt_spec, payload.style)

        # Generate images
        return self._generate_images(
            prompt=prompt,
            config=payload.config,
            reference_images=payload.retrieval_result.to_dict()["images"]
        )

    def _generate_images(
        self,
        prompt: str,
        config: GenerationConfig,
        reference_images: List[str]
    ) -> Tuple[List[Optional[str]], List[Optional[str]]]:
        """
        Internal method to generate images using Nano Banana API.

        Args:
            prompt: Formatted prompt string
            config: Generation configuration
            reference_images: Paths to reference images

        Returns:
            Tuple of (image_paths, image_errors). For each index:
              - Success: paths[i] = file path, errors[i] = None
              - Failure: paths[i] = None, errors[i] = error message
        """
        if self.client is None:
            raise RuntimeError("Image generation client not initialized. Set GOOGLE_API_KEY in your environment.")

        # Create output directory with timestamp
        timestamp = get_timestamp()
        output_dir = create_output_directory(config.output_dir, timestamp)

        print(f"Calling Nano Banana API...")
        print(f"  Prompt: {prompt[:80]}...")
        print(f"  References: {len(reference_images)}")

        image_data_list, image_errors = self.client.generate(
            prompt=prompt,
            reference_images=reference_images,
            num_images=config.num_images,
            resolution=config.resolution,
            aspect_ratio=config.aspect_ratio,
            image_size=config.image_size,
            seed=config.seed
        )

        # Save successful images (with optional grayscale conversion) in parallel
        generated_paths = [None] * len(image_data_list)

        # Collect indices that have image data
        success_indices = [i for i, data in enumerate(image_data_list) if data is not None]

        if success_indices:
            def _process_and_save(i, data):
                if config.enforce_grayscale:
                    data = convert_to_grayscale(data)
                out = Path(output_dir) / f"sketch_{i}.png"
                with open(out, 'wb') as f:
                    f.write(data)
                return str(out.absolute())

            from concurrent.futures import ThreadPoolExecutor, as_completed
            with ThreadPoolExecutor(max_workers=len(success_indices)) as pool:
                futures = {
                    pool.submit(_process_and_save, i, image_data_list[i]): i
                    for i in success_indices
                }
                for future in as_completed(futures):
                    idx = futures[future]
                    generated_paths[idx] = future.result()

        success_count = sum(1 for p in generated_paths if p is not None)
        fail_count = sum(1 for e in image_errors if e is not None)
        grayscale_msg = " (converted to grayscale)" if config.enforce_grayscale else ""
        print(f"[OK] Generated {success_count}/{len(image_data_list)} images{grayscale_msg}" +
              (f", {fail_count} failed" if fail_count else ""))

        return generated_paths, image_errors

    def refine(
        self,
        refine_prompt: str,
        original_context: str,
        refine_history: List[str],
        source_image_paths: List[str],
        config: GenerationConfig,
    ) -> Tuple[List[Optional[str]], List[Optional[str]]]:
        """
        Refine existing sketch images. Bypasses format_prompt() entirely.

        Each source image produces exactly 1 refined output (1:1 mapping).

        Args:
            refine_prompt: User's modification instructions
            original_context: Original GPT-compiled refined_intent
            refine_history: Previous refine prompts in order (for chaining)
            source_image_paths: Absolute paths to sketches to modify
            config: Generation configuration

        Returns:
            Tuple of (image_paths, image_errors)
        """
        if self.client is None:
            raise RuntimeError("Image generation client not initialized. Set GOOGLE_API_KEY in your environment.")

        # Create output directory with timestamp
        timestamp = get_timestamp()
        output_dir = create_output_directory(config.output_dir, timestamp)

        print(f"Calling Nano Banana API (refine mode)...")
        print(f"  Refine prompt: {refine_prompt[:80]}...")
        print(f"  Source images: {len(source_image_paths)}")

        image_data_list, image_errors = self.client.refine(
            refine_prompt=refine_prompt,
            original_context=original_context,
            refine_history=refine_history,
            source_images=source_image_paths,
            aspect_ratio=config.aspect_ratio,
        )

        # Save successful images (with optional grayscale conversion) in parallel
        generated_paths = [None] * len(image_data_list)
        success_indices = [i for i, data in enumerate(image_data_list) if data is not None]

        if success_indices:
            def _process_and_save(i, data):
                if config.enforce_grayscale:
                    data = convert_to_grayscale(data)
                out = Path(output_dir) / f"sketch_{i}.png"
                with open(out, 'wb') as f:
                    f.write(data)
                return str(out.absolute())

            from concurrent.futures import ThreadPoolExecutor, as_completed
            with ThreadPoolExecutor(max_workers=len(success_indices)) as pool:
                futures = {
                    pool.submit(_process_and_save, i, image_data_list[i]): i
                    for i in success_indices
                }
                for future in as_completed(futures):
                    idx = futures[future]
                    generated_paths[idx] = future.result()

        success_count = sum(1 for p in generated_paths if p is not None)
        fail_count = sum(1 for e in image_errors if e is not None)
        grayscale_msg = " (converted to grayscale)" if config.enforce_grayscale else ""
        print(f"[OK] Refined {success_count}/{len(image_data_list)} images{grayscale_msg}" +
              (f", {fail_count} failed" if fail_count else ""))

        return generated_paths, image_errors
