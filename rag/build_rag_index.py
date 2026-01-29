#!/usr/bin/env python3
"""
Build CLIP embeddings for RAG reference images.

This script should be run once after adding reference images to rag/reference_images/
or whenever you want to rebuild the embeddings cache.
"""
from pathlib import Path
import json
import os


def main():
    print("Building RAG index with CLIP embeddings...")

    # Initialize CLIP embedder
    from rag.embedder import ImageEmbedder

    # Model name will be read from CLIP_MODEL env var by ImageEmbedder.__init__
    # Embedding dimension is fixed by the model architecture
    embedder = ImageEmbedder(
        embedding_dim=512
    )

    # Find all reference images
    ref_dir = Path("refserence_images")
    if not ref_dir.exists():
        print(f"ERROR: {ref_dir} not found")
        print("Please create rag/reference_images/ and add your images")
        return

    image_paths = sorted([
        p for ext in ["*.png", "*.PNG", "*.jpg", "*.JPG", "*.jpeg", "*.JPEG"]
        for p in ref_dir.glob(ext)
    ])
    print(f"Found {len(image_paths)} reference images")

    if len(image_paths) == 0:
        print("ERROR: No images found in rag/reference_images/")
        print("Supported formats: .png, .jpg")
        return

    # Generate embeddings
    print("\nGenerating CLIP embeddings...")
    embeddings_data = []

    for i, img_path in enumerate(image_paths, 1):
        print(f"  [{i}/{len(image_paths)}] {img_path.name}")
        embedding = embedder.embed_image(str(img_path))

        embeddings_data.append({
            "image_path": str(img_path.absolute()),
            "embedding": embedding,
            "filename": img_path.name
        })

    # Save to cache
    cache_dir = Path("cache/")
    cache_dir.mkdir(exist_ok=True)
    cache_file = cache_dir / "embeddings.json"

    cache_data = {
        "embedding_dim": embedder.embedding_dim,
        "model": embedder.model_name,
        "num_images": len(embeddings_data),
        "embeddings": embeddings_data
    }

    with open(cache_file, 'w') as f:
        json.dump(cache_data, f, indent=2)

    print(f"\n✓ Embeddings saved to {cache_file}")
    print(f"✓ Total: {len(embeddings_data)} images indexed")
    print(f"✓ Embedding dimension: {embedder.embedding_dim}")


if __name__ == "__main__":
    main()
