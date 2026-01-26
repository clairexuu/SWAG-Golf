# generate/adapter.py
from abc import ABC, abstractmethod
from typing import List
from .types import GenerationPayload, GenerationConfig
from prompt.schema import PromptSpec


class ImageModelAdapter(ABC):
    """
    Abstract base class for model-agnostic image generation.
    Ensures consistent interface regardless of underlying model (Nano Banana, etc.)
    """

    @abstractmethod
    def generate(self, payload: GenerationPayload) -> List[str]:
        """
        Generate images and return list of file paths.

        Args:
            payload: GenerationPayload containing prompt, references, and config

        Returns:
            List of absolute paths to generated images
        """
        pass

    @abstractmethod
    def validate_config(self, config: GenerationConfig) -> bool:
        """
        Validate generation configuration.

        Args:
            config: GenerationConfig to validate

        Returns:
            True if valid, raises ValueError if invalid
        """
        pass

    def format_prompt(self, prompt_spec: PromptSpec) -> str:
        """
        Convert PromptSpec to model-specific prompt string.
        Default implementation creates a comprehensive prompt.

        Args:
            prompt_spec: Compiled PromptSpec from prompt compiler

        Returns:
            Formatted prompt string for image generation
        """
        # Build comprehensive prompt from PromptSpec
        prompt_parts = [prompt_spec.refined_intent]

        # Add subject matter if specified
        if prompt_spec.subject_matter:
            prompt_parts.append(f"Subject: {prompt_spec.subject_matter}")

        # Add mood if specified
        if prompt_spec.mood:
            prompt_parts.append(f"Mood: {prompt_spec.mood}")

        # Add technique if specified
        if prompt_spec.technique:
            prompt_parts.append(f"Technique: {prompt_spec.technique}")

        # Add composition notes if specified
        if prompt_spec.composition_notes:
            prompt_parts.append(f"Composition: {prompt_spec.composition_notes}")

        # Add visual constraints for sketch generation
        sketch_constraints = [
            "Style: rough sketch",
            "black and white only",
            "thick outlines",
            "minimal interior detail",
            "clean background",
            "pencil or loose ink drawing"
        ]
        prompt_parts.extend(sketch_constraints)

        # Join all parts
        prompt = ", ".join(prompt_parts)

        # Add negative constraints if any
        if prompt_spec.negative_constraints:
            negative = ", ".join(prompt_spec.negative_constraints)
            prompt += f"\n\nAvoid: {negative}, color, gradients, textures, photorealism, typography"

        return prompt
