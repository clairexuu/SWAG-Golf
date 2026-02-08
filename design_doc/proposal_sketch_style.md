# Style Consistency Improvement Proposals

## Executive Summary

The current pipeline uses:
1. **RAG retrieval** via `ImageRetriever` using CLIP/SigLIP embeddings to find semantically similar reference images
2. **Prompt compilation** via `PromptCompiler` using GPT to refine user intent with style context
3. **Image generation** via `NanaBananaAdapter` calling Gemini 2.5 Flash Image API with reference images passed as context

The challenge: While Gemini receives reference images, it may not perfectly reproduce the specific visual style (line weight, looseness, sketch quality) of those references.

## Improved In-Context Guidance

### Overview

Enhance how reference images and style information are passed to Gemini to improve style matching without architectural changes.

### Strategy 1: Reference Image Selection Optimization

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

### Strategy 2: Enhanced Prompt Engineering

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

### Strategy 3: Multi-Turn Generation with Feedback

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

### Strategy 4: Image Preprocessing

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

