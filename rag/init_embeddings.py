#!/usr/bin/env python3
"""
Initialize CLIP embeddings for RAG reference images.

Run this script after adding images to a style or modifying style.json.
Embeddings must be pre-built before running retrieval.

Usage:
    python -m rag.init_embeddings --style default           # Single style
    python -m rag.init_embeddings --style default vintage   # Multiple styles
    python -m rag.init_embeddings --all                     # All styles
    python -m rag.init_embeddings --style default --force   # Force rebuild
"""
import argparse
import sys
from pathlib import Path

from style.registry import StyleRegistry
from .embedder import ImageEmbedder
from .index import StyleImageIndex


def build_style_embeddings(
    style_id: str,
    style_registry: StyleRegistry,
    embedder: ImageEmbedder,
    force: bool = False,
    cache_dir: str = "rag/cache"
) -> int:
    """
    Build embeddings for a single style.

    Args:
        style_id: The style identifier
        style_registry: StyleRegistry instance
        embedder: ImageEmbedder instance
        force: If True, rebuild even if cache exists
        cache_dir: Directory for cached embeddings

    Returns:
        Number of images indexed
    """
    cache_path = Path(cache_dir) / f"{style_id}_embeddings.json"

    if cache_path.exists() and not force:
        print(f"  Cache exists for '{style_id}'. Use --force to rebuild.")
        return 0

    # Create index and build embeddings
    index = StyleImageIndex(
        style_id=style_id,
        style_registry=style_registry,
        embedder=embedder,
        cache_dir=cache_dir
    )

    embeddings = index.build_index()
    return len(embeddings)


def main():
    parser = argparse.ArgumentParser(
        description="Initialize CLIP embeddings for RAG reference images."
    )
    parser.add_argument(
        "--style",
        nargs="+",
        help="Style ID(s) to build embeddings for"
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Build embeddings for all styles"
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Force rebuild even if cache exists"
    )

    args = parser.parse_args()

    # Validate arguments
    if not args.style and not args.all:
        parser.error("Must specify --style or --all")

    if args.style and args.all:
        parser.error("Cannot use both --style and --all")

    # Initialize components
    print("Initializing embedding system...")
    style_registry = StyleRegistry()
    embedder = ImageEmbedder()

    # Determine which styles to process
    if args.all:
        style_ids = style_registry.list_styles()
        if not style_ids:
            print("ERROR: No styles found in style library")
            sys.exit(1)
        print(f"Building embeddings for all {len(style_ids)} styles...")
    else:
        style_ids = args.style
        # Validate style IDs exist
        for style_id in style_ids:
            if not style_registry.validate_style(style_id):
                print(f"ERROR: Style '{style_id}' not found")
                sys.exit(1)

    # Build embeddings for each style
    print()
    total_images = 0
    for style_id in style_ids:
        print(f"Processing style: {style_id}")
        try:
            count = build_style_embeddings(
                style_id=style_id,
                style_registry=style_registry,
                embedder=embedder,
                force=args.force
            )
            if count > 0:
                print(f"  ✓ Indexed {count} images")
                total_images += count
        except Exception as e:
            print(f"  ✗ Error: {e}")
            sys.exit(1)

    # Summary
    print()
    if total_images > 0:
        print(f"✓ Total: {total_images} images indexed across {len(style_ids)} style(s)")
    else:
        print("No embeddings were built (caches already exist, use --force to rebuild)")


if __name__ == "__main__":
    main()
