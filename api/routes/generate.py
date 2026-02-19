"""Generate endpoint - runs the full generation pipeline."""

import json
import os
import shutil
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from api.services.pipeline import PipelineService

MAX_GENERATIONS_PER_STYLE = 100
GENERATED_DIR = Path("generated_outputs")

router = APIRouter()


class GenerateRequest(BaseModel):
    """Request body for generation endpoint."""
    input: str
    styleId: str
    numImages: Optional[int] = 4
    experimentalMode: Optional[bool] = False
    sessionId: Optional[str] = None


def _prune_generations(style_id: str):
    """Delete oldest generation folders for a style beyond MAX_GENERATIONS_PER_STYLE."""
    if not GENERATED_DIR.exists():
        return

    # Collect all generation dirs belonging to this style
    style_dirs = []
    for entry in sorted(GENERATED_DIR.iterdir(), reverse=True):
        if not entry.is_dir():
            continue
        metadata_path = entry / "metadata.json"
        if not metadata_path.exists():
            continue
        try:
            with open(metadata_path, "r") as f:
                meta = json.load(f)
            if meta.get("style", {}).get("id") == style_id:
                style_dirs.append(entry)
        except (json.JSONDecodeError, IOError):
            continue

    # Remove excess (already sorted newest-first)
    for old_dir in style_dirs[MAX_GENERATIONS_PER_STYLE:]:
        shutil.rmtree(old_dir, ignore_errors=True)


@router.post("/generate")
async def generate_sketches(request: GenerateRequest):
    """
    Run the full generation pipeline (async).

    Request:
        {
            input: string (user's natural language description),
            styleId: string,
            numImages?: number (default 4),
            experimentalMode?: boolean
        }

    Response matches TypeScript GenerateResponse interface.
    """
    try:
        # Validate input
        if not request.input or not request.input.strip():
            raise HTTPException(status_code=400, detail="Input cannot be empty")

        service = PipelineService()

        # Run async pipeline
        result, prompt_spec, retrieval_result, style = await service.generate_async(
            user_input=request.input,
            style_id=request.styleId,
            num_images=request.numImages or 4,
            session_id=request.sessionId
        )

        # Build response matching TypeScript interface
        sketches = []
        for i, image_path in enumerate(result.images):
            sketch = {
                "id": f"{result.timestamp}_sketch_{i}",
                "resolution": list(result.config.resolution),
                "metadata": {
                    "promptSpec": {
                        "intent": prompt_spec.intent,
                        "refinedIntent": prompt_spec.refined_intent,
                        "negativeConstraints": prompt_spec.negative_constraints or []
                    },
                    "referenceImages": [img.path for img in retrieval_result.images],
                    "retrievalScores": retrieval_result.scores
                }
            }

            if image_path is not None:
                # Successful image — include path
                rel_path = Path(image_path).relative_to(Path("generated_outputs").resolve())
                sketch["imagePath"] = f"/generated/{rel_path}"
            else:
                # Failed image — include error message
                sketch["imagePath"] = None
                sketch["error"] = result.image_errors[i] if i < len(result.image_errors) else "Unknown error"

            sketches.append(sketch)

        response = {
            "success": True,
            "data": {
                "timestamp": result.timestamp,
                "sketches": sketches,
                "generationMetadata": {
                    "styleId": style.id,
                    "configUsed": {
                        "numImages": result.config.num_images,
                        "resolution": list(result.config.resolution),
                        "outputDir": result.config.output_dir,
                        "modelName": result.config.model_name,
                        "seed": result.config.seed
                    }
                }
            }
        }

        # Prune old generations for this style to keep only the most recent 100
        _prune_generations(request.styleId)

        return response

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        return {
            "success": False,
            "error": {
                "code": "GENERATION_ERROR",
                "message": str(e)
            }
        }


@router.post("/generate-stream")
async def generate_sketches_stream(request: GenerateRequest):
    """
    SSE streaming endpoint — yields events as each image completes.

    Events:
      event: progress  — prompt compilation / RAG stages complete
      event: image     — an individual sketch is ready
      event: complete  — all images done
      event: error     — something went wrong
    """
    if not request.input or not request.input.strip():
        raise HTTPException(status_code=400, detail="Input cannot be empty")

    service = PipelineService()

    async def event_generator():
        try:
            async for event in service.generate_streaming(
                user_input=request.input,
                style_id=request.styleId,
                num_images=request.numImages or 4,
                session_id=request.sessionId
            ):
                yield f"event: {event['event']}\ndata: {json.dumps(event['data'])}\n\n"

            # Prune after completion
            _prune_generations(request.styleId)

        except Exception as e:
            yield f"event: error\ndata: {json.dumps({'message': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )


class RefineRequest(BaseModel):
    """Request body for refine endpoint."""
    refinePrompt: str
    selectedImagePaths: List[str]  # relative URLs: "/generated/timestamp/sketch_0.png"
    styleId: str
    sessionId: Optional[str] = None


def _resolve_image_path(relative_url: str) -> str:
    """Convert /generated/timestamp/sketch.png to absolute path under generated_outputs/."""
    rel_part = relative_url.replace("/generated/", "", 1)
    abs_path = Path("generated_outputs").resolve() / rel_part
    if not abs_path.exists():
        raise ValueError(f"Image not found: {abs_path}")
    return str(abs_path)


@router.post("/refine")
def refine_sketches(request: RefineRequest):
    """
    Refine existing sketch images by applying modification instructions.

    Each selected image is refined independently (1:1 mapping).
    Response matches the same GenerateResponse interface as /generate.
    """
    try:
        # Validate inputs
        if not request.refinePrompt or not request.refinePrompt.strip():
            raise HTTPException(status_code=400, detail="Refine prompt cannot be empty")

        if not request.selectedImagePaths:
            raise HTTPException(status_code=400, detail="At least one image must be selected")

        # Resolve relative URLs to absolute filesystem paths
        resolved_paths = []
        for rel_url in request.selectedImagePaths:
            resolved_paths.append(_resolve_image_path(rel_url))

        service = PipelineService()

        # Run refine pipeline
        result, style = service.refine(
            refine_prompt=request.refinePrompt,
            selected_image_paths=resolved_paths,
            style_id=request.styleId,
            session_id=request.sessionId,
        )

        # Build response matching TypeScript GenerateResponse interface
        sketches = []
        for i, image_path in enumerate(result.images):
            sketch = {
                "id": f"{result.timestamp}_sketch_{i}",
                "resolution": list(result.config.resolution),
                "metadata": {
                    "promptSpec": {
                        "intent": result.prompt_spec.intent,
                        "refinedIntent": result.prompt_spec.refined_intent,
                        "negativeConstraints": result.prompt_spec.negative_constraints or []
                    },
                    "referenceImages": resolved_paths,
                    "retrievalScores": []
                }
            }

            if image_path is not None:
                rel_path = Path(image_path).relative_to(Path("generated_outputs").resolve())
                sketch["imagePath"] = f"/generated/{rel_path}"
            else:
                sketch["imagePath"] = None
                sketch["error"] = result.image_errors[i] if i < len(result.image_errors) else "Unknown error"

            sketches.append(sketch)

        response = {
            "success": True,
            "data": {
                "timestamp": result.timestamp,
                "sketches": sketches,
                "generationMetadata": {
                    "styleId": style.id,
                    "configUsed": {
                        "numImages": result.config.num_images,
                        "resolution": list(result.config.resolution),
                        "outputDir": result.config.output_dir,
                        "modelName": result.config.model_name,
                        "seed": result.config.seed
                    }
                }
            }
        }

        _prune_generations(request.styleId)

        return response

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        return {
            "success": False,
            "error": {
                "code": "REFINE_ERROR",
                "message": str(e)
            }
        }
