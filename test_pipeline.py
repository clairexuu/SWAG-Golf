#!/usr/bin/env python3
"""
Test simplified end-to-end pipeline without style selection.

This script tests the complete flow:
1. Load RAG embeddings
2. Compile natural language with GPT
3. Retrieve reference images
4. Generate sketches with Nano Banana
"""
import os
from pathlib import Path
from dotenv import load_dotenv


def main():
    load_dotenv()

    if not os.getenv("OPENAI_API_KEY"):
        print("ERROR: OPENAI_API_KEY not found in .env")
        print("Please create .env file with your OpenAI API key")
        return

    print("="*60)
    print("SIMPLIFIED SWAG-GOLF PIPELINE TEST")
    print("="*60)

    # Step 1: Initialize style registry
    print("\n[1/4] Initializing style registry...")
    from style.registry import StyleRegistry

    style_registry = StyleRegistry()
    style = style_registry.get_style("default")
    print(f"✓ Loaded style: {style.name}")

    # Step 2: Compile prompt with GPT
    print("\n[2/4] Compiling prompt with GPT...")
    from prompt.compiler import PromptCompiler

    gpt_model = os.getenv("GPT_MODEL", "gpt-4o")
    compiler = PromptCompiler(model=gpt_model)
    user_input = "swag, cool, cartooned bull with a baseball bat and sunglasses, walking confidently"

    # Compile with style object
    prompt_spec = compiler.compile(user_input, style)
    print(f"✓ Compiled: {prompt_spec.refined_intent}")

    # Step 3: Retrieve references with RAG
    print("\n[3/4] Retrieving reference images...")
    from rag.embedder import ImageEmbedder
    from rag.index import IndexRegistry
    from rag.retriever import ImageRetriever

    # Initialize RAG components
    embedder = ImageEmbedder()
    index_registry = IndexRegistry(style_registry, embedder, cache_dir="rag/cache")
    retriever = ImageRetriever(index_registry, embedder)

    # Retrieve using proper RAG system
    retrieval_result = retriever.retrieve(prompt_spec, style, top_k=5)

    print(f"✓ Retrieved {len(retrieval_result.images)} references")
    for i, (img, score) in enumerate(zip(retrieval_result.images, retrieval_result.scores), 1):
        print(f"  {i}. {Path(img.path).name} (similarity: {score:.3f})")

    # Validate text-based retrieval
    if retrieval_result.images:
        print(f"\n✓ Text-based retrieval successful (query: '{prompt_spec.refined_intent[:50]}...')")
        if retrieval_result.scores[0] < 0.2:
            print(f"  Warning: Low similarity score ({retrieval_result.scores[0]:.3f}) - check prompt quality")

    # Step 4: Generate images with Nano Banana
    print("\n[4/4] Generating images...")
    from generate.generator import ImageGenerator
    from generate.types import GenerationConfig

    generator = ImageGenerator()

    config = GenerationConfig(
        num_images=4,
        resolution=(1024, 1024),
        output_dir="generated_outputs"
    )

    # retrieval_result is already created in Step 3
    result = generator.generate(
        prompt_spec=prompt_spec,
        retrieval_result=retrieval_result,
        style=style,
        config=config
    )

    print(f"\n✓ COMPLETE: {len(result.images)} sketches generated")
    print(f"Output directory: {Path(result.images[0]).parent}")
    print(f"Metadata: {result.metadata_path}")

    print("\n" + "="*60)
    print("Pipeline test completed successfully!")
    print("="*60)


if __name__ == "__main__":
    main()
