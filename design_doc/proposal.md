# Style Consistency Improvement Proposals

## Executive Summary

The current pipeline uses:
1. **RAG retrieval** via `ImageRetriever` using CLIP/SigLIP embeddings to find semantically similar reference images
2. **Prompt compilation** via `PromptCompiler` using GPT to refine user intent with style context
3. **Image generation** via `NanaBananaAdapter` calling Gemini 2.5 Flash Image API with reference images passed as context

The challenge: While Gemini receives reference images, it may not perfectly reproduce the specific visual style (line weight, looseness, sketch quality) of those references.

This document presents three complementary approaches to improve style fidelity.

---

## Current Architecture

```
User Input + Style Selection
        │
        ▼
PromptCompiler (GPT) ──► PromptSpec
        │
        ▼
ImageRetriever (CLIP/SigLIP) ──► RetrievalResult (top-K reference images)
        │
        ▼
NanaBananaAdapter ──► Gemini 2.5 Flash Image API
        │
        ▼
Generated Sketches
```

**Key files:**
- `generate/nano_banana_client.py` - Gemini API integration
- `generate/adapter.py` - Abstract adapter with `format_prompt()`
- `rag/retriever.py` - Reference image retrieval
- `prompt/compiler.py` - GPT-based prompt compilation

---

## Approach 1: Post-Generation Style Transfer

### Overview

Apply neural style transfer as a post-processing step after Gemini generates the initial sketch. This maps generated images closer to the visual characteristics of reference images.

### Method Options

| Method | Speed | Quality | Flexibility |
|--------|-------|---------|-------------|
| Classic NST (Gatys et al.) | Slow (2-5 min) | High | Single style |
| Fast Style Transfer (Johnson) | Real-time | Medium | Pre-training required |
| **AdaIN** (Huang & Belongie) | Real-time | High | Arbitrary style |
| **SANet** (Style-Attentional) | Real-time | Very High | Arbitrary style |
| Diffusion-based (ControlNet) | Medium (5-15s) | Very High | Arbitrary style |

**Recommended: AdaIN or SANet** for arbitrary style transfer without per-style training.

### Technical Details

AdaIN (Adaptive Instance Normalization) aligns content features to match style statistics:
```python
AdaIN(x, y) = σ(y) * ((x - μ(x)) / σ(x)) + μ(y)
```

SANet adds attention mechanisms for better local style transfer, particularly useful for preserving sketch line quality.

### Implementation

**New module structure:**
```
generate/style_transfer/
├── __init__.py
├── base.py          # Abstract StyleTransfer class
├── adain.py         # AdaIN implementation
├── sanet.py         # SANet implementation (optional)
└── models/          # Pre-trained weights (~100MB)
```

**Integration in `generator.py`:**
```python
def generate(self, prompt_spec, retrieval_result, style, config):
    # Existing generation
    image_paths = self.adapter.generate(payload)

    # Post-process with style transfer
    if config.enable_style_transfer:
        style_image = retrieval_result.images[0].path
        image_paths = self.style_transfer.apply(
            content_images=image_paths,
            style_image=style_image,
            strength=config.style_strength  # 0.0-1.0
        )

    return result
```

**New config options:**
```python
enable_style_transfer: bool = False
style_strength: float = 0.7
style_transfer_method: str = "adain"  # or "sanet"
```

### Requirements

| Resource | Requirement |
|----------|-------------|
| GPU Memory | 4-8GB VRAM |
| Latency Added | 0.5-2 seconds per image |
| Infrastructure | PyTorch + CUDA |
| Cost | ~$0.01-0.02 per image |

### Key Libraries

- [pytorch-AdaIN](https://github.com/naoto0804/pytorch-AdaIN)
- [SANET](https://github.com/GlebSBrykin/SANET)
- torchvision (VGG feature extraction)

### Pros & Cons

**Pros:**
- Non-invasive: doesn't change upstream pipeline
- Adjustable: style strength can be tuned per generation
- No training required: uses pre-trained models
- Works with any reference image

**Cons:**
- Adds latency (0.5-2s per image)
- May over-stylize or lose content structure
- Less effective for sketch-specific qualities (line weight, looseness)
- Requires GPU infrastructure

---

## Approach 2: Fine-Tuning / LoRA Training

### Overview

Train adapter weights on the designer's reference images to teach a model the specific visual style. Creates a model that inherently generates in the target style.

### Important Note: Gemini Limitations

**Gemini does not support fine-tuning through its public API.** Fine-tuning is only available through Vertex AI for enterprise customers.

**This approach requires switching to a different base model** (FLUX.1 or Stable Diffusion XL).

### Method Options

| Method | Dataset Size | Training Time | VRAM | Quality |
|--------|-------------|---------------|------|---------|
| **LoRA** | 15-50 images | 1-3 hours | 8-16GB | High |
| DreamBooth | 5-20 images | 3-6 hours | 24GB+ | Very High |
| Textual Inversion | 5-15 images | 1-2 hours | 8GB | Medium |

**Recommended: LoRA** because:
- Works with small datasets (30-50 images)
- Fast training (1-3 hours on consumer GPU)
- Small adapter files (3-100MB)
- Can be swapped/combined at inference

### Implementation

**Architecture change - new adapters:**
```
generate/
├── adapters/
│   ├── gemini.py          # Current (keep for fallback)
│   ├── flux.py            # NEW: FLUX.1 adapter
│   └── sdxl.py            # NEW: SDXL adapter
├── lora/
│   ├── trainer.py         # LoRA training orchestration
│   ├── dataset.py         # Prepare training data
│   └── weights/           # Trained LoRA files per style
```

**Training pipeline:**
```python
class StyleLoRATrainer:
    def train(self, style_id: str, images: List[str], trigger_word: str):
        """
        Train LoRA on reference images for a style.

        Recommended settings:
        - rank: 16
        - alpha: 8
        - learning_rate: 1e-4
        - epochs: 10-20
        - resolution: 1024x1024
        """
        dataset = self.prepare_dataset(images, trigger_word)
        lora_path = f"lora/weights/{style_id}.safetensors"
        # ... training logic
        return lora_path
```

**Inference with LoRA:**
```python
class FluxAdapter(ImageModelAdapter):
    def generate(self, payload: GenerationPayload) -> List[str]:
        # Load style-specific LoRA
        lora_path = f"lora/weights/{payload.style.id}.safetensors"
        self.pipeline.load_lora_weights(lora_path)

        # Generate with trigger word
        prompt = f"[style_{payload.style.id}] {payload.prompt_spec.refined_intent}"
        images = self.pipeline(prompt, num_images=payload.config.num_images)

        return self._save_images(images)
```

**Style registry extension:**
```json
{
  "name": "Vintage Mascot",
  "lora_path": "lora/weights/vintage-mascot.safetensors",
  "trigger_word": "vmascot_style"
}
```

### Requirements

| Phase | Resource | Cost |
|-------|----------|------|
| Training | A100 GPU, 2-4 hours | $5-20 per style |
| Inference | T4/A10 GPU | ~$0.01-0.03 per image |
| Storage | LoRA weights | 10-100MB per style |

**Training infrastructure options:**
- RunPod/Lambda Labs: $1-2/hour for A100
- [Fal.ai FLUX Trainer](https://fal.ai/models/fal-ai/flux-lora-fast-training): $0.50-2.00 per run
- Modal: Pay-per-second GPU
- Local: RTX 4090 (24GB VRAM)

### Key Libraries

- [diffusers](https://huggingface.co/docs/diffusers/training/lora) - LoRA training
- [kohya-ss](https://github.com/bmaltais/kohya_ss) - Advanced training tool
- [FLUX.1-dev](https://huggingface.co/black-forest-labs/FLUX.1-dev) - Base model
- PEFT - Parameter-efficient fine-tuning

### Pros & Cons

**Pros:**
- Best style fidelity achievable (85-95%)
- Fast inference once trained
- Each style is isolated (no cross-contamination)
- Can combine multiple LoRAs for blended styles

**Cons:**
- Requires switching from Gemini to FLUX/SDXL
- Training overhead for each new style
- Needs GPU infrastructure for training
- More complex deployment
- May need retraining as style evolves

---

## Approach 3: Improved In-Context Guidance

### Overview

Enhance how reference images and style information are passed to Gemini to improve style matching without architectural changes.

### Strategy 3.1: Reference Image Selection Optimization

**Current:** Top-K by semantic similarity to refined_intent

**Improvements:**

**a) Diversified Selection (MMR):**
```python
def retrieve_diversified(self, prompt_spec, style, top_k=5):
    # Get top-2K candidates
    candidates = self._rank_by_similarity(prompt_spec, style, k=top_k*4)

    # Apply maximal marginal relevance for diversity
    selected = self._mmr_selection(candidates, top_k, diversity_weight=0.3)
    return selected
```

**b) Style-Element Clustering:** Retrieve images showcasing different style elements (line weight, composition, subject type)

**c) Negative Example Inclusion:**
```python
enhanced_prompt = f"""
{prompt}

STYLE TO MATCH: See reference images 1-5
STYLE TO AVOID: See reference image 6 (do NOT generate like this)
"""
```

### Strategy 3.2: Enhanced Prompt Engineering

**Current structure:**
```python
def format_prompt(self, prompt_spec, style):
    prompt = prompt_spec.refined_intent
    prompt += f"\n\n**Style: {style.name}**\n{style.description}"
    prompt += "\n\n**VISUAL RULES:**"
```

**Enhanced structure:**
```python
def format_prompt_enhanced(self, prompt_spec, style, reference_images):
    # Analyze references with Gemini Vision
    style_analysis = self._analyze_style(reference_images)

    prompt = f"""
SUBJECT: {prompt_spec.refined_intent}

STYLE DEFINITION: {style.name}
{style.description}

EXTRACTED STYLE CHARACTERISTICS (from reference images):
- Line Quality: {style_analysis['line_quality']}
- Stroke Weight: {style_analysis['stroke_weight']}
- Level of Detail: {style_analysis['detail_level']}
- Composition Style: {style_analysis['composition']}
- Shading Technique: {style_analysis['shading']}

VISUAL RULES (MANDATORY):
{self._format_visual_rules(style.visual_rules)}

REFERENCE ALIGNMENT:
Match the EXACT line weight, stroke looseness, and sketch quality of the provided reference images.
Do NOT add more detail than shown in references.
Do NOT make lines cleaner/smoother than references.
"""
    return prompt
```

### Strategy 3.3: Multi-Turn Generation with Feedback

```python
def generate_with_refinement(self, prompt, reference_images, num_iterations=2):
    # First generation
    initial_images = self.generate(prompt, reference_images)

    for iteration in range(num_iterations - 1):
        # Analyze style deviation
        deviation = self._analyze_style_deviation(
            generated=initial_images,
            references=reference_images
        )

        # Refinement prompt
        refinement_prompt = f"""
The previous generation deviated from the reference style:
{deviation}

Please regenerate with corrections. Original request: {prompt}
"""
        initial_images = self.generate(refinement_prompt, reference_images)

    return initial_images
```

### Strategy 3.4: Image Preprocessing

```python
class ReferenceImagePreprocessor:
    def preprocess(self, image_paths: List[str]) -> List[str]:
        processed = []
        for path in image_paths:
            img = Image.open(path)
            img = self._auto_crop(img)           # Remove whitespace
            img = self._normalize_levels(img)    # Normalize contrast
            img = self._resize_for_api(img)      # Consistent dimensions
            processed.append(self._save_temp(img))
        return processed
```

### Implementation

**New modules:**
```
rag/
├── preprocessing.py    # Image preprocessing
└── diversity.py        # MMR selection
```

**Config extensions:**
```python
enable_style_analysis: bool = True
reference_preprocessing: bool = True
multi_turn_refinement: int = 1  # 1 = single shot, 2+ = with refinement
reference_diversity_weight: float = 0.3
```

### Requirements

| Change | Cost Impact |
|--------|-------------|
| More reference images | +$0.001-0.002 per image |
| Multi-turn generation | 2-3x API calls |
| Image preprocessing | Minimal (CPU only) |
| Vision analysis | +$0.01 per analysis |

### Key Libraries

- Gemini API (existing)
- PIL/Pillow - Image preprocessing
- OpenCV - Edge detection, auto-cropping
- scikit-learn - MMR diversity selection

### Pros & Cons

**Pros:**
- No architecture changes required
- Works with existing Gemini API
- Incremental improvements can be tested independently
- Low additional cost
- Can be combined with other approaches

**Cons:**
- Limited by Gemini's inherent capabilities
- Improvements may be marginal (40-60%)
- Multi-turn increases latency and cost
- Style analysis adds complexity

---

## Comparison Summary

| Criterion | Style Transfer | LoRA Training | In-Context |
|-----------|---------------|---------------|------------|
| **Complexity** | Medium | High | Low-Medium |
| **Style Fidelity** | 60-75% | 85-95% | 40-60% |
| **Latency Impact** | +0.5-2s | Minimal | +0-5s |
| **Cost per Image** | +$0.01-0.02 | +$0.01-0.03 | +$0.001-0.01 |
| **Training Required** | No | Yes (per style) | No |
| **Architecture Change** | Minor | Major | None |
| **Implementation Time** | 1-2 weeks | 3-6 weeks | 1 week |

---

## Recommended Phased Rollout

### Phase 1: In-Context Guidance (Week 1)
- Low risk, immediate improvements
- Establishes baseline for measuring other approaches
- No infrastructure changes

### Phase 2: Post-Generation Style Transfer (Weeks 2-3)
- Can be toggled on/off per generation
- Works with existing Gemini output
- Requires GPU infrastructure

### Phase 3: LoRA Training (Weeks 4-8)
- Only if Phases 1+2 don't meet requirements
- Requires stakeholder buy-in for architecture change
- Best for styles that need exact replication

---

## References

### Neural Style Transfer
- [PyTorch AdaIN](https://github.com/naoto0804/pytorch-AdaIN)
- [SANet](https://github.com/GlebSBrykin/SANET)
- [PyTorch NST Tutorial](https://docs.pytorch.org/tutorials/advanced/neural_style_tutorial.html)

### LoRA Training
- [Diffusers LoRA Guide](https://huggingface.co/docs/diffusers/training/lora)
- [Kohya-ss Training](https://github.com/bmaltais/kohya_ss)
- [Fal.ai FLUX Training](https://fal.ai/models/fal-ai/flux-lora-fast-training)

### Gemini API
- [Gemini 2.5 Flash Image](https://developers.googleblog.com/en/introducing-gemini-2-5-flash-image/)
- [Image Generation Docs](https://ai.google.dev/gemini-api/docs/image-generation)
- [Prompting Best Practices](https://developers.googleblog.com/en/how-to-prompt-gemini-2-5-flash-image-generation-for-the-best-results/)

### Style Conditioning
- [IP-Adapter](https://ip-adapter.github.io/)
- [IP-Adapter Diffusers](https://huggingface.co/docs/diffusers/en/using-diffusers/ip_adapter)
