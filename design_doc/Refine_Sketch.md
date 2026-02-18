# Refine Sketch

Users select one or more generated sketches and provide modification instructions. The system feeds Gemini the selected sketch images alongside the instructions and generates edited versions that replace the originals in-place.

- Separate pipeline from generate — Gemini receives an editing-focused system prompt, not the creation-focused one
- 1:1 mapping — each selected sketch produces exactly one refined output
- In-place replacement — only selected positions in the grid are swapped; unselected sketches stay untouched
- Chaining — users can refine an already-refined image; original context and refinement history are preserved

## Why a Separate Path

The standard generate pipeline is incompatible with refine:

| | Generate | Refine |
|---|---|---|
| **System prompt** | "Creating mascot/character patterns" | "Editing an existing sketch" |
| **Enhanced prompt** | "Match the style of reference images" | "Apply ONLY the requested changes" |
| **Images sent** | RAG-retrieved style references | The sketch to modify |
| **Prompt compilation** | GPT compiles user input into PromptSpec | Skipped — refine prompt passed directly |
| **RAG retrieval** | Yes | Skipped |

A `refine()` method is added at every layer, keeping the standard `generate()` path untouched.

## Data Flow

```
User clicks "Refine" tab → selects sketches 0, 2 → types "put on sunglasses" → submits
    ↓
StudioPage.handleSubmitRefine()
    → selectedIndices = [0, 2], imagePaths = [sketches[0].imagePath, sketches[2].imagePath]
    → GenerationContext.refine({ refinePrompt, selectedImagePaths, styleId, sessionId }, [0, 2])
        ↓
    POST /api/refine → Express proxy → Python /refine
        ↓
    PipelineService.refine():
        1. Get style from registry
        2. Get original_context (refined_intent from last role="generate" turn)
        3. Collect refine_history (all prior role="refine" turns' user_input)
        4. ImageGenerator.refine() → NanaBananaAdapter.refine() → NanaBananaClient.refine()
            → 2 parallel Gemini calls, each with REFINE_SYSTEM_PROMPT + 1 source sketch
        5. Record role="refine" turn in session
        ↓
    Response: 2 refined sketches
        ↓
    GenerationContext merges in-place:
        sketches[0] = refined[0], sketches[2] = refined[1]
        sketches[1], sketches[3] unchanged
```

## Implementation

### Backend — Separate Refine Path

**`generate/nano_banana_client.py`** — `REFINE_SYSTEM_PROMPT` + `refine()` + `_generate_single_image_refine()`

The refine system prompt instructs Gemini to edit (not create): grayscale only, preserve composition, apply only requested changes. Each Gemini call receives exactly one source sketch image.

```python
def refine(
    self,
    refine_prompt: str,           # Current modification instructions
    original_context: str,        # GPT-compiled refined_intent from initial generation
    refine_history: List[str],    # Previous refine prompts (for chaining)
    source_images: List[str],     # Paths to sketches to modify
    aspect_ratio: str = "9:16",
    temperature: float = 0.6,     # Lower than generate (0.8) for faithful edits
) -> Tuple[List[Optional[bytes]], List[Optional[str]]]:
```

Enhanced prompt per image:
```
EXISTING SKETCH: [attached image]
ORIGINAL DESIGN CONTEXT: {original_context}
PREVIOUS REFINEMENTS ALREADY APPLIED:
1. {refine_history[0]}
2. {refine_history[1]}
CURRENT MODIFICATION INSTRUCTIONS: {refine_prompt}
```

**`generate/nano_banana.py`** — `NanaBananaAdapter.refine()` bypasses `format_prompt()` entirely. Reuses `validate_config()`, output directory creation, and grayscale conversion.

**`generate/generator.py`** — `ImageGenerator.refine()` orchestrates adapter call, saves metadata with `mode: "refine"`.

**`api/services/pipeline.py`** — `PipelineService.refine()` skips GPT compilation and RAG. Extracts `original_context` from the last `role="generate"` turn and `refine_history` from all `role="refine"` turns. Records a `role="refine"` session turn.

### API

**Python (`api/routes/generate.py`)**
```python
class RefineRequest(BaseModel):
    refinePrompt: str
    selectedImagePaths: List[str]  # Relative URLs: "/generated/timestamp/sketch_0.png"
    styleId: str
    sessionId: Optional[str] = None
```

`POST /refine` resolves relative URLs to absolute paths, calls `PipelineService.refine()`, returns the same `GenerateResponse` shape as `/generate`.

**Express (`control/api/src/routes/generate.ts`)** — `POST /refine` validates and proxies to Python. No mock fallback.

**Shared types (`control/shared/schema/api-contracts.ts`)** — `RefineRequest` interface. Response reuses `GenerateResponse`.

### Frontend

**`GenerationContext.tsx`** — `refine()` mirrors `generate()` for abort/loading/error, but merges results in-place:
```typescript
setSketches(prev => {
  const next = [...prev];
  response.data!.sketches.forEach((refined, i) => {
    next[selectedIndices[i]] = refined;
  });
  return next;
});
```

**`PromptComposer.tsx`** — Third tab "Refine" with amber accent. Mode lifted to StudioPage. Accepts `selectedSketchCount`; submit disabled when 0. Placeholder dynamically shows selection count.

**`SketchCard.tsx`** — In refine mode: checkbox overlay (top-left), amber ring when selected, click toggles selection instead of opening lightbox.

**`SketchGrid.tsx`** — Accepts `selectionMode`, `selectedIndices`, `onToggleSelect`. Shows "N selected" badge.

**`StudioPage.tsx`** — Owns `composerMode` and `selectedSketchIndices` state. `handleSubmitRefine()` extracts image paths from selected indices, calls `refine()`, clears selection on completion. Selection clears when leaving refine mode or switching styles.

### Session (`feedback/session.py`)

`role="refine"` turns recorded alongside existing `"generate"` and `"feedback"` turns. `to_gpt_messages()` formats them as `[Refinement] {user_input}` so future GPT compilations have context.

## Files Modified

| File | Change |
|---|---|
| `generate/nano_banana_client.py` | `REFINE_SYSTEM_PROMPT`, `refine()`, `_generate_single_image_refine()` |
| `generate/nano_banana.py` | `NanaBananaAdapter.refine()` |
| `generate/generator.py` | `ImageGenerator.refine()` |
| `api/services/pipeline.py` | `PipelineService.refine()` |
| `api/routes/generate.py` | `RefineRequest`, `POST /refine` |
| `feedback/session.py` | `role="refine"` handling |
| `control/api/src/routes/generate.ts` | Express `POST /refine` proxy |
| `control/shared/schema/api-contracts.ts` | `RefineRequest` interface |
| `control/frontend/src/services/api.ts` | `refineSketches()` |
| `control/frontend/src/context/GenerationContext.tsx` | `refine()` with in-place merge |
| `control/frontend/src/components/CenterPanel/PromptComposer.tsx` | Refine tab, lifted mode |
| `control/frontend/src/components/RightPanel/SketchCard.tsx` | Selection checkbox/highlight |
| `control/frontend/src/components/RightPanel/SketchGrid.tsx` | Selection mode props |
| `control/frontend/src/components/shared/Icons.tsx` | `RefineIcon` |
| `control/frontend/src/pages/StudioPage.tsx` | Selection state, refine handler |
