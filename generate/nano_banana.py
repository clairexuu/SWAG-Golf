# generate/nano_banana.py
import os
from typing import List, Optional
from pathlib import Path
from dotenv import load_dotenv
from .adapter import ImageModelAdapter
from .types import GenerationPayload, GenerationConfig
from .utils import create_blank_sketch, get_timestamp, create_output_directory, convert_to_grayscale
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
            print("✓ Nano Banana client initialized")
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

    def generate(self, payload: GenerationPayload) -> List[str]:
        """
        Generate sketch images using Nano Banana.

        PLACEHOLDER: Currently generates blank grayscale placeholder images.
        For production, this will make API calls to Nano Banana.

        Args:
            payload: GenerationPayload with prompt, references, and config

        Returns:
            List of absolute paths to generated images
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
    ) -> List[str]:
        """
        Internal method to generate images using Nano Banana API.

        Args:
            prompt: Formatted prompt string
            config: Generation configuration
            reference_images: Paths to reference images

        Returns:
            List of paths to generated images
        """
        # Create output directory with timestamp
        timestamp = get_timestamp()
        output_dir = create_output_directory(config.output_dir, timestamp)

        # Try real API first
        if self.client is not None:
            try:
                print(f"Calling Nano Banana API...")
                print(f"  Prompt: {prompt[:80]}...")
                print(f"  References: {len(reference_images)}")

                image_data_list = self.client.generate(
                    prompt=prompt,
                    reference_images=reference_images,
                    num_images=config.num_images,
                    resolution=config.resolution,
                    aspect_ratio=config.aspect_ratio,
                    image_size=config.image_size,
                    seed=config.seed
                )

                # Save images (with optional grayscale conversion)
                generated_paths = []
                for i, image_data in enumerate(image_data_list):
                    # Apply grayscale conversion if enabled
                    if config.enforce_grayscale:
                        image_data = convert_to_grayscale(image_data)

                    output_path = Path(output_dir) / f"sketch_{i}.png"
                    with open(output_path, 'wb') as f:
                        f.write(image_data)
                    generated_paths.append(str(output_path.absolute()))

                grayscale_msg = " (converted to grayscale)" if config.enforce_grayscale else ""
                print(f"✓ Generated {len(generated_paths)} images{grayscale_msg}")
                return generated_paths

            except Exception as e:
                print(f"ERROR: Nano Banana API failed: {e}")
                print("Falling back to placeholders...")

        # Fallback: placeholder images
        print("Using placeholder images...")
        generated_paths = []
        for i in range(config.num_images):
            output_path = Path(output_dir) / f"sketch_{i}_placeholder.png"
            created_path = create_blank_sketch(config.resolution, str(output_path))
            generated_paths.append(created_path)

        return generated_paths
