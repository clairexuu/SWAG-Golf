# Retrieval-Augmented Generation (RAG)

A retrieval-augmented generation system that hard-filters reference images by style, then retrieves top-K semantically similar images using vision-language model embeddings. Ensures generated sketches reflect real Swag designer work rather than generic model aesthetics.

## Retrieval Workflow

1. **Hard filter** by style: Only consider images from selected style
2. **Text embedding**: Convert `prompt_spec.refined_intent` to vector using the embedding model
3. **Semantic ranking**: Compare text embedding against all reference image embeddings
4. **Top-K selection**: Return most similar images with similarity scores

## Embedding Initialization

**Embeddings must be pre-built before running retrieval.** The system will raise an error if you attempt retrieval without a cache.

### Building Embeddings

```bash
# Single style
python -m rag.init_embeddings --style default

# Multiple styles
python -m rag.init_embeddings --style default vintage-mascot

# All styles
python -m rag.init_embeddings --all

# Force rebuild (overwrites existing cache)
python -m rag.init_embeddings --style default --force
```

### When to Rebuild

Run `init_embeddings.py` after:
- Adding new images to `rag/reference_images/`
- Modifying `style.json` to add/remove images
- Changing the embedding model (CLIP_MODEL in .env)

### Error Messages

If you forget to build embeddings:
```
ValueError: No embeddings cache for style 'default'.
Run: python -m rag.init_embeddings --style default
```

## Style → Image → Embedding Flow

### Where Data Lives

| Location | Contents |
|----------|----------|
| `style/style_library/{style_id}/style.json` | Defines which images belong to this style |
| `rag/reference_images/` | Actual image files (shared pool) |
| `rag/cache/{style_id}_embeddings.json` | Pre-computed embeddings tagged with style_id |

### How Style Maps to Embeddings

```
StyleRegistry.get_style("default")
    │
    ▼
Reads style/style_library/default/style.json
    │   {
    │     "reference_images": ["IMG_4171.PNG", "IMG_4172.PNG", ...]
    │   }
    ▼
Returns Style object with:
    style.id = "default"
    style.reference_images = [
        "rag/reference_images/IMG_4171.PNG",
        ...
    ]
```

The style→image mapping is defined in `style.json`, not inferred from image files.

## Components

### `ImageEmbedder` - Vision-language embedding generation

Generates normalized embedding vectors using CLIP or SigLIP models. Dimension varies by model (e.g., 512 for CLIP ViT-B/32, 768 for SigLIP base).

**Methods:**
- `embed_image(image_path)` → embedding vector
- `embed_text(text)` → embedding vector
- `embed_batch(image_paths)` → list of embeddings
- `embed_text_batch(texts)` → list of embeddings

**Configuration:**
```bash
# .env file
CLIP_MODEL=google/siglip-base-patch16-224  # current default
# Other options: openai/clip-vit-base-patch32, laion/CLIP-ViT-bigG-14-laion2B-39B-b160k
```


### `StyleImageIndex` - Embedding cache for single style

Manages embeddings for one style with lazy loading and JSON caching.

**Methods:**
- `get_embeddings()` → list of embeddings (loads from cache, raises error if missing)
- `build_index()` → rebuild embeddings for all reference images
- `clear_cache()` → delete cached embeddings

**Cache location:** `rag/cache/{style_id}_embeddings.json`

**Note:** `get_embeddings()` requires pre-built cache. It will not auto-generate embeddings.

### `IndexRegistry` - Multi-style index manager

**Methods:**
- `get_index(style_id)` → StyleImageIndex for requested style
- `rebuild_all()` → rebuild all style indices
- `clear_cache()` → clear all cached embeddings

### `ImageRetriever` - Main retrieval orchestrator

**Constructor:**
- `__init__(index_registry, embedder, config=None)`
  - `config`: RetrievalConfig with `top_k`, `min_similarity`, `include_negative`

**Methods:**
- `retrieve(prompt_spec, style, top_k=None)` → RetrievalResult
  - Uses `prompt_spec.refined_intent` for semantic search
  - Falls back to `prompt_spec.intent` if refined_intent is empty
  - Hard-filters by style, ranks by cosine similarity

**Retrieval Flow:**
1. Extract style_id from style object
2. Get style's image embeddings from index
3. Convert `prompt_spec.refined_intent` to text embedding
4. Compute cosine similarity between query and all images
5. Rank by similarity (descending)
6. Apply minimum similarity threshold
7. Filter out `do_not_use` images
8. Return top-K results

### Data Types

**RetrievalResult:**
- `images` - list of ReferenceImage objects
- `scores` - similarity scores (0.0 to 1.0)
- `query_context` - metadata (style_id, intent, refined_intent, top_k)
- `to_dict()` - convert to payload format

**RetrievalConfig:**
- `top_k` (default: 3) - number of images to retrieve (reduced from 5 for faster Gemini payload)
- `min_similarity` (default: 0.0) - threshold for filtering
- `include_negative` (default: False) - include do_not_use images

**ReferenceImage:**
- `path` - image file path
- `style_id` - style identifier
- `embedding` - embedding vector (dimension depends on model)
- `metadata` - additional info

## Usage

### Basic Setup

```python
from style.registry import StyleRegistry
from rag import ImageEmbedder, IndexRegistry, ImageRetriever, RetrievalConfig

# Initialize components
style_registry = StyleRegistry()
embedder = ImageEmbedder()
index_registry = IndexRegistry(style_registry, embedder)
retriever = ImageRetriever(index_registry, embedder)
```

### Retrieval Example

```python
from prompt.schema import PromptSpec

# Get compiled prompt spec (from PromptCompiler)
prompt_spec = PromptSpec(
    intent="Cool mascot character",
    refined_intent="Playful mascot character with bold lines"
)

# Get style
style = style_registry.get_style("vintage-mascot")

# Retrieve top-3 similar images
result = retriever.retrieve(prompt_spec, style, top_k=3)

# Access results
for img, score in zip(result.images, result.scores):
    print(f"{img.path}: {score:.3f}")
```

### Cache Management

```bash
# Recommended: Use the CLI script
python -m rag.init_embeddings --style vintage-mascot --force
```

```python
# Or programmatically (for advanced use)
index = index_registry.get_index("vintage-mascot")
index.build_index()  # Rebuilds and saves to cache
index.clear_cache()  # Deletes cache file
```

## Future Enhancements

- **Vector databases:** FAISS/Pinecone for 1000+ images
- **Fine-tuning:** Domain-adapt embedding model on golf apparel designs
- **Relevance feedback:** Learn from designer selections
- **Negative learning:** Use `do_not_use` images for contrastive training