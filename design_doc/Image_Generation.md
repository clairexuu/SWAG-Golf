# Image Generation

## Overview

The image generation module uses Nano Banana as a model-agnostic image generation service that receives compiled prompt specifications and RAG-retrieved reference images through an adapter layer to produce sketch-only concept drawings optimized for designer workflows. The system generates 3 to 6 rough concept sketches with controlled variation in layout and exaggeration, producing intentionally non-final output ready for designer refinement.

## Implementation

### Architecture

The `generate/` module implements a flexible, model-agnostic architecture with the following components:

**Core Components:**
- **ImageGenerator** - Main orchestrator that coordinates the generation workflow
- **ImageModelAdapter** - Abstract base class defining the interface for any image model
- **NanaBananaAdapter** - Concrete implementation for Nano Banana (currently uses placeholder)
- **GenerationConfig** - Configuration dataclass for generation parameters
- **GenerationResult** - Structured output containing image paths, metadata, and configuration

**File Structure:**
```
generate/
├── __init__.py           # Module exports
├── types.py              # Data structures (Config, Result, Payload)
├── adapter.py            # Abstract base class for model adapters
├── nano_banana.py        # Nano Banana implementation (placeholder)
├── generator.py          # Main orchestrator
└── utils.py              # Helper functions (image creation, metadata)
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
retrieval_result = retriever.retrieve(prompt_spec, top_k=5)

# Generate concept sketches
config = GenerationConfig(num_images=4, resolution=(1024, 1024))
result = generator.generate(
    prompt_spec=prompt_spec,
    retrieval_result=retrieval_result,
    visual_rules=style.visual_rules,
    config=config
)

# Access outputs
print(f"Generated {len(result.images)} sketches")
print(f"Output directory: {result.timestamp}")
print(f"Metadata: {result.metadata_path}")
```

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
  "visual_rules": {...},
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
- High resolution (default: 1024x1024)
- Easy to draw over
- Looks like a 10-15 minute human sketch
- Timestamped output directories prevent overwriting
- Complete metadata for reproducibility

## Model Integration

### Current Status (Demo/Placeholder)
The current implementation uses **placeholder generation** with blank grayscale canvases. This allows the full pipeline to be tested and demonstrated while the actual Nano Banana integration is completed.

### Production Integration
To integrate the real Nano Banana model, replace the `_generate_images()` method in `generate/nano_banana.py`:

```python
def _generate_images(self, prompt, config, reference_images):
    # Production implementation
    response = self.client.generate(
        prompt=prompt,
        reference_images=reference_images,
        num_images=config.num_images,
        resolution=config.resolution,
        seed=config.seed,
        style_strength=0.8,
        sketch_mode=True
    )

    # Save and return image paths
    generated_paths = []
    for i, image_data in enumerate(response.images):
        output_path = Path(output_dir) / f"sketch_{i}.png"
        with open(output_path, 'wb') as f:
            f.write(image_data)
        generated_paths.append(str(output_path.absolute()))

    return generated_paths
```

The adapter pattern ensures the rest of the codebase remains unchanged when swapping from placeholder to production implementation.