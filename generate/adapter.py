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

    def format_prompt(self, prompt_spec: PromptSpec, style) -> str:
        """
        Convert PromptSpec to model-specific prompt string.
        Default implementation creates a comprehensive prompt.

        Args:
            prompt_spec: Compiled PromptSpec from prompt compiler
            style: Style object with name, description, and visual_rules

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

        # Add composition notes if specified
        if prompt_spec.composition_notes:
            prompt_parts.append(f"Composition: {prompt_spec.composition_notes}")

        # Add perspective if specified
        if prompt_spec.perspective:
            prompt_parts.append(f"Perspective: {prompt_spec.perspective}")

        # Join main parts
        prompt = ", ".join(prompt_parts)

        # Add style information
        prompt += f"\n\n**Style: {style.name}**\n{style.description}"

        # Add visual rules from style
        prompt += "\n\n**VISUAL RULES:**"
        if isinstance(style.visual_rules, dict):
            # Format dictionary as key-value pairs
            for key, value in style.visual_rules.items():
                if key != "additional_rules":
                    prompt += f"\n- {key.replace('_', ' ').title()}: {value}"
                elif isinstance(value, dict) and value:
                    # Add additional_rules if present
                    for rule_key, rule_value in value.items():
                        prompt += f"\n- {rule_key.replace('_', ' ').title()}: {rule_value}"
        else:
            # Fallback for list format (if used in future)
            for rule in style.visual_rules:
                prompt += f"\n- {rule}"

        # Add negative constraints if any
        if prompt_spec.negative_constraints:
            negative = ", ".join(prompt_spec.negative_constraints)
            prompt += f"\n\n**Avoid:** {negative}"

        return prompt
