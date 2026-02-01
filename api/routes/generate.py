"""Generate endpoint - runs the full generation pipeline."""

import os
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from api.services.pipeline import PipelineService

router = APIRouter()


class GenerateRequest(BaseModel):
    """Request body for generation endpoint."""
    input: str
    styleId: str
    numImages: Optional[int] = 4
    experimentalMode: Optional[bool] = False


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
            num_images=request.numImages or 4
        )

        # Build response matching TypeScript interface
        sketches = []
        for i, image_path in enumerate(result.images):
            # Extract just the filename from the path
            # Images are saved in generated_outputs/{timestamp}/sketch_N.png
            # We serve them at /generated/{timestamp}/sketch_N.png
            rel_path = Path(image_path).relative_to(Path("generated_outputs").resolve())

            sketches.append({
                "id": f"sketch_{i}",
                "imagePath": f"/generated/{rel_path}",
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
            })

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
