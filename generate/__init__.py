# generate/__init__.py
"""
Image Generation Module

This module provides model-agnostic image generation capabilities for the
SWAG Concept Sketch Agent. It generates 3-6 rough concept sketches from
compiled prompts and RAG-retrieved reference images.

Key Components:
- ImageGenerator: Main orchestrator for generation workflow
- GenerationConfig: Configuration for generation parameters
- GenerationResult: Structured output with image paths and metadata
- ImageModelAdapter: Abstract base class for model implementations
- NanaBananaAdapter: Concrete implementation for Nano Banana (with placeholder)

Usage Example:
    from generate import ImageGenerator, GenerationConfig
    from prompt.compiler import PromptCompiler
    from style.registry import StyleRegistry
    from rag.retriever import ImageRetriever

    # Setup
    style = StyleRegistry().get_style("vintage-mascot")
    compiler = PromptCompiler()
    retriever = ImageRetriever()
    generator = ImageGenerator()

    # Generate
    prompt_spec = compiler.compile("playful golf mascot", style)
    retrieval_result = retriever.retrieve(prompt_spec, top_k=5)
    config = GenerationConfig(num_images=4)

    result = generator.generate(
        prompt_spec=prompt_spec,
        retrieval_result=retrieval_result,
        visual_rules=style.visual_rules,
        config=config
    )

    # Access outputs
    print(f"Generated {len(result.images)} sketches")
    print(f"Saved to: {result.timestamp}")
"""

from .types import GenerationConfig, GenerationResult, GenerationPayload
from .adapter import ImageModelAdapter
from .nano_banana import NanaBananaAdapter
from .generator import ImageGenerator

__all__ = [
    "GenerationConfig",
    "GenerationResult",
    "GenerationPayload",
    "ImageModelAdapter",
    "NanaBananaAdapter",
    "ImageGenerator",
]
