# Retrieval-Augmented Generation (RAG)

A retrieval-augmented generation system that hard-filters the reference image database by the designer's selected style, then retrieves top-K semantically similar images using embeddings to ensure exact stylistic fidelity in generated concept sketches. This RAG system is the primary mechanism for stylistic accuracy, ensuring generated sketches reflect real Swag designer work rather than generic model aesthetics.

## Architecture

The RAG module is located in `rag/` and consists of six core components:

### Module Structure

```
rag/
├── __init__.py          # Module exports
├── types.py             # Data type definitions (dataclasses)
├── embedder.py          # Embedding generation (currently placeholder)
├── index.py             # Image index management with caching
├── retriever.py         # Core retrieval orchestration
├── utils.py             # Helper functions (cosine similarity, etc.)
└── cache/               # JSON cache for embeddings (auto-generated)
```

### Core Components

#### 1. Data Types (`types.py`)

**ReferenceImage**
- Represents a reference image in the style library
- Fields: `path`, `style_id`, `embedding`, `metadata`

**ImageEmbedding**
- Stores image path + embedding vector + style metadata
- Used internally for index storage

**RetrievalResult**
- Contains retrieval query results
- Fields: `images` (list of ReferenceImage), `scores` (similarity scores), `query_context`
- Includes `to_dict()` method for generation payload formatting

**RetrievalConfig**
- Configuration for retrieval behavior
- Fields: `top_k` (default: 5), `min_similarity` (default: 0.0), `include_negative` (default: False)

#### 2. Embedding Generation (`embedder.py`)

**ImageEmbedder** - PLACEHOLDER IMPLEMENTATION
- Currently generates random normalized 768-dimensional vectors
- Designed for drop-in replacement with real embedding models (CLIP, OpenAI, custom vision models)
- Methods:
  - `embed_image(image_path)`: Generate embedding for single image
  - `embed_batch(image_paths)`: Batch embedding generation
- Includes detailed TODO comments for swapping in production models

**Why Placeholder?**
Allows end-to-end testing of the retrieval pipeline without ML dependencies. The interface is production-ready and can be replaced with real embeddings without changing downstream code.

#### 3. Index Management (`index.py`)

**StyleImageIndex**
- Manages embeddings for a single style with lazy loading and caching
- Loads reference images from StyleRegistry
- Generates embeddings using ImageEmbedder
- Persists to `rag/cache/{style_id}_embeddings.json`
- Methods:
  - `get_embeddings()`: Lazy load embeddings (from cache or build)
  - `build_index()`: Generate embeddings for all style references
  - `clear_cache()`: Remove cached embeddings

**IndexRegistry**
- Registry pattern for accessing style-specific indices
- Mirrors StyleRegistry design for consistency
- Manages multiple StyleImageIndex instances with caching
- Methods:
  - `get_index(style_id)`: Get or create index for a style
  - `rebuild_all()`: Rebuild all style indices
  - `clear_cache()`: Clear all cached embeddings

**Cache Format:**
```json
{
  "style_id": "vintage-mascot",
  "embedding_dim": 768,
  "created_at": "2026-01-25T14:30:00",
  "embeddings": [
    {
      "image_path": "/path/to/reference.jpg",
      "embedding": [0.1, 0.2, ...],
      "style_id": "vintage-mascot"
    }
  ]
}
```

#### 4. Retrieval Orchestration (`retriever.py`)

**ImageRetriever**
- Main orchestration class for the retrieval pipeline
- Implements style-based hard filtering and semantic ranking
- Methods:
  - `retrieve(prompt_spec, top_k)`: Retrieve references for a PromptSpec
  - `retrieve_by_text(text, style_id, top_k)`: Direct text-based retrieval

**Retrieval Flow:**
1. Extract `style_id` from PromptSpec
2. Hard-filter: Get only that style's embeddings via IndexRegistry
3. Compute query embedding (placeholder: uses first image as proxy)
4. Calculate cosine similarity for all candidate images
5. Rank by similarity score (descending)
6. Apply minimum similarity threshold
7. Filter out images from `do_not_use` list (if configured)
8. Select top-K results
9. Return RetrievalResult with images, scores, and context

#### 5. Utility Functions (`utils.py`)

- `cosine_similarity(vec1, vec2)`: Compute cosine similarity between vectors
- `validate_image_path(path)`: Check if image exists with valid extension
- `normalize_vector(vec)`: Normalize vector to unit length

## Usage

### Basic Setup

```python
from style.registry import StyleRegistry
from rag import ImageEmbedder, IndexRegistry, ImageRetriever, RetrievalConfig

# Initialize components (one-time setup)
style_registry = StyleRegistry()
embedder = ImageEmbedder()  # Placeholder for now
index_registry = IndexRegistry(style_registry, embedder)
config = RetrievalConfig(top_k=5, min_similarity=0.3)
retriever = ImageRetriever(index_registry, config)
```

### Retrieval from PromptSpec

```python
from prompt.schema import PromptSpec

# PromptSpec from prompt compilation step
prompt_spec = PromptSpec(
    intent="Cool mascot character",
    refined_intent="Playful mascot character with bold lines",
    style_id="vintage-mascot",
    visual_constraints={},
    negative_constraints=[]
)

# Retrieve top-5 reference images
result = retriever.retrieve(prompt_spec, top_k=5)

# Access results
print(f"Retrieved {len(result.images)} images")
for img, score in zip(result.images, result.scores):
    print(f"  {img.path}: similarity={score:.3f}")

# Convert to generation payload format
generation_payload = {
    "prompt": prompt_spec.to_dict(),
    "reference_images": result.to_dict(),
    "style_constraints": style.visual_rules
}
```

### Direct Text-based Retrieval

```python
# Retrieve by text query and style ID
result = retriever.retrieve_by_text(
    text="Bold mascot character with thick lines",
    style_id="vintage-mascot",
    top_k=5
)
```

### Cache Management

```python
# Rebuild index for a specific style
index = index_registry.get_index("vintage-mascot")
index.build_index()

# Clear cache for a style
index.clear_cache()

# Rebuild all style indices
index_registry.rebuild_all()

# Clear all caches
index_registry.clear_cache()
```

## Integration with Pipeline

The RAG module integrates seamlessly into the pipeline workflow:

```python
# In pipeline.py
from style.registry import StyleRegistry
from prompt.compiler import PromptCompiler
from rag import ImageEmbedder, IndexRegistry, ImageRetriever

# Setup
style_registry = StyleRegistry()
prompt_compiler = PromptCompiler()
embedder = ImageEmbedder()
index_registry = IndexRegistry(style_registry, embedder)
retriever = ImageRetriever(index_registry)xs

# Pipeline execution
def generate_sketch(user_input: str, style_id: str):
    # 1. Get style
    style = style_registry.get_style(style_id)

    # 2. Compile prompt
    prompt_spec = prompt_compiler.compile(user_input, style)

    # 3. Retrieve reference images
    retrieval_result = retriever.retrieve(prompt_spec, top_k=5)

    # 4. Build generation payload
    payload = {
        "prompt": prompt_spec.to_dict(),
        "references": retrieval_result.to_dict(),
        "style": style.visual_rules
    }

    # 5. Send to image generation (Nano Banana)
    # generated_image = image_generator.generate(payload)

    return retrieval_result
```

## Future Enhancements

**1. Real Embedding Models**
Replace `ImageEmbedder` with production models:
- CLIP (OpenAI) - multimodal vision-language model
- OpenAI Embeddings API
- Custom fine-tuned vision models

**2. Vector Databases**
For scale beyond MVP (1000+ images):
- FAISS for efficient approximate nearest neighbor (ANN)
- Pinecone, Weaviate, or Milvus for production scale
- Sub-millisecond search times

**3. Negative Example Learning**
Leverage `do_not_use` images:
- Contrastive learning to push away from negative examples
- Improve relevance by learning what NOT to retrieve

**4. Relevance Feedback**
- Learn from designer selections and rejections
- Adjust ranking based on which references get used
- Personalized retrieval over time