"""Generate endpoint - runs the full generation pipeline."""

import json
import os
import shutil
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException
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
def generate_sketches(request: GenerateRequest):
    """
    Run the full generation pipeline.

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

        # Run pipeline
        result, prompt_spec, retrieval_result, style = service.generate(
            user_input=request.input,
            style_id=request.styleId,
            num_images=request.numImages or 4,
            session_id=request.sessionId
        )

        # Build response matching TypeScript interface
        sketches = []
        for i, image_path in enumerate(result.images):
            sketch = {
                "id": f"sketch_{i}",
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
