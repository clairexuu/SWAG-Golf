# Image Generation

## Overview

The image generation module uses Nano Banana as a model-agnostic image generation service that receives compiled prompt specifications and RAG-retrieved reference images through an adapter layer to produce sketch-only concept drawings optimized for designer workflows. The system generates 3 to 6 rough concept sketches with controlled variation in layout and exaggeration, producing intentionally non-final output ready for designer refinement.

## Implementation

### Architecture

The `generate/` module implements a flexible, model-agnostic architecture with the following components:

**Core Components:**
- **ImageGenerator** - Main orchestrator that coordinates the generation workflow (sync, async, and streaming)
- **ImageModelAdapter** - Abstract base class defining the interface for any image model
- **NanaBananaAdapter** - Concrete implementation for Nano Banana with sync, async, and streaming generation
- **GenerationConfig** - Configuration dataclass for generation parameters
- **GenerationResult** - Structured output containing image paths, metadata, and configuration

**File Structure:**
```
generate/
├── __init__.py              # Module exports
├── types.py                 # Data structures (Config, Result, Payload)
├── adapter.py               # Abstract base class for model adapters
├── nano_banana.py           # Nano Banana adapter (sync, async, streaming)
├── nano_banana_client.py    # Gemini API client (sync, async, streaming)
├── generator.py             # Main orchestrator
└── utils.py                 # Helper functions (image creation, metadata)
```

### Usage

```python
from generate import ImageGenerator, GenerationConfig
from prompt.compiler import PromptCompiler
from style.registry import StyleRegistry
from rag.retriever import ImageRetriever

# Setup pipeline components
style = StyleRegistry().get_style("vintage-mascot")
compiler = PromptCompiler()
retriever = ImageRetriever()
generator = ImageGenerator()

# Compile prompt
prompt_spec = compiler.compile("playful golf mascot", style)

# Retrieve reference images
retrieval_result = retriever.retrieve(prompt_spec, style, top_k=3)

# Generate concept sketches
config = GenerationConfig(num_images=4, resolution=(1024, 1024))
result = generator.generate(
    prompt_spec=prompt_spec,
    retrieval_result=retrieval_result,
    style=style,
    config=config
)

# Access outputs
print(f"Generated {len(result.images)} sketches")
print(f"Output directory: {result.timestamp}")
print(f"Metadata: {result.metadata_path}")
```

### Configuration

**Model Selection:**
The Gemini model is configured via the `GEMINI_MODEL` environment variable in `.env`:
```bash
# Default model (nano banana)
GEMINI_MODEL=gemini-2.5-flash-image

# Upgrade to pro model
GEMINI_MODEL=gemini-3-pro-image-preview
```

The [generate/nano_banana_client.py](generate/nano_banana_client.py) automatically reads this configuration with proper fallbacks. No code changes are required to switch models—simply update the `.env` file.

### Output Structure

Generated images are saved in timestamped directories:

```
generated_outputs/
└── 20260125_143022/
    ├── metadata.json          # Generation parameters and configuration
    ├── sketch_0.png          # 1024x1024 grayscale sketch
    ├── sketch_1.png
    ├── sketch_2.png
    └── sketch_3.png
```

**Metadata Format:**
```json
{
  "timestamp": "2026-01-25T14:30:22",
  "prompt_spec": {...},
  "reference_images": ["path1.jpg", "path2.jpg"],
  "retrieval_scores": [0.95, 0.87, 0.82],
  "style_id": "vintage-mascot",
  "config": {
    "num_images": 4,
    "resolution": [1024, 1024],
    "model_name": "nano-banana",
    "seed": null
  },
  "images": ["sketch_0.png", "sketch_1.png", ...]
}
```

## Output Constraints

The generation system enforces strict visual and practical constraints to ensure output is optimized for designer draw-over workflows:

### Visual Rules
- Black & white or grayscale only
- Rough sketch / pencil / loose ink style
- Thick outlines
- Minimal interior detail
- No color
- No gradients
- No textures
- No photorealism
- No typography unless explicitly requested

### Practical Rules
- Clean background
- 1K resolution by default (configurable to 2K/4K via `image_size` in GenerationConfig)
- Easy to draw over
- Looks like a 10-15 minute human sketch
- Timestamped output directories prevent overwriting
- Complete metadata for reproducibility

## Model Integration

### Generation Modes

The system supports three generation modes:

**Sync** — `generate()`: Uses `ThreadPoolExecutor` for parallel Gemini API calls. Used as fallback.

**Async** — `generate_async()`: Uses native async Gemini SDK (`client.aio.models.generate_content()`) with `asyncio.gather()` for concurrent image generation. Integrates natively with FastAPI's async event loop. Used by the `/generate` endpoint.

**Streaming** — `generate_streaming_async()`: Uses `asyncio.as_completed()` to yield `(index, image_path, error)` tuples as each Gemini call completes. Enables SSE progressive display where images appear one-by-one in the frontend. Used by the `/generate-stream` endpoint.

Each mode is implemented across all layers: `NanaBananaClient` → `NanaBananaAdapter` → `ImageGenerator` → `PipelineService` → API route.

### Async Dependency

Async generation requires the `aiohttp` extra for the Google GenAI SDK:
```bash
pip install google-genai[aiohttp]
```