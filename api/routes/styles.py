"""Styles endpoint - returns available styles from StyleRegistry."""

import json
import os
import shutil
import tempfile
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

from api.services.pipeline import PipelineService
from api.utils.case_converter import convert_keys_to_camel


class DeleteImagesRequest(BaseModel):
    filenames: List[str]

router = APIRouter()


@router.get("/styles")
def get_styles():
    """
    Return all available styles from the StyleRegistry.

    Response format matches TypeScript Style interface:
    {
        success: true,
        styles: [
            {
                id: string,
                name: string,
                description: string,
                visualRules: { lineWeight, looseness, complexity, additionalRules },
                referenceImages: [],  // Empty - not needed for frontend display
                doNotUse: []
            }
        ]
    }
    """
    try:
        service = PipelineService()
        styles = service.get_all_styles()

        styles_data = []
        for style in styles:
            style_dict = {
                "id": style.id,
                "name": style.name,
                "description": style.description,
                "visual_rules": style.visual_rules,
                "reference_images": [os.path.basename(p) for p in style.reference_images],
                "do_not_use": []
            }
            styles_data.append(convert_keys_to_camel(style_dict))

        return {"success": True, "styles": styles_data}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/styles")
async def create_style(
    name: str = Form(...),
    description: str = Form(""),
    visual_rules: str = Form("{}"),
    images: Optional[List[UploadFile]] = File(None),
):
    """
    Create a new style with optional reference images.
    Builds embeddings if images are provided.
    """
    tmp_dir = None
    try:
        service = PipelineService()

        # Parse visual_rules JSON string
        try:
            rules = json.loads(visual_rules)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid visual_rules JSON")

        # Save uploaded files to temp directory (if any)
        saved_files: List[Path] = []
        if images:
            tmp_dir = Path(tempfile.mkdtemp(prefix="swag_create_"))
            for upload in images:
                suffix = Path(upload.filename or "image.png").suffix.lower()
                dest = tmp_dir / f"{len(saved_files)}{suffix}"
                with open(dest, "wb") as f:
                    content = await upload.read()
                    f.write(content)
                saved_files.append(dest)

        style = service.create_style(
            name=name,
            description=description,
            visual_rules=rules,
            image_files=saved_files or None,
        )

        style_dict = {
            "id": style.id,
            "name": style.name,
            "description": style.description,
            "visual_rules": style.visual_rules,
            "reference_images": [os.path.basename(p) for p in style.reference_images],
            "do_not_use": [],
        }

        return {"success": True, "style": convert_keys_to_camel(style_dict)}

    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if tmp_dir and tmp_dir.exists():
            shutil.rmtree(str(tmp_dir), ignore_errors=True)


@router.post("/styles/{style_id}/images")
async def add_images_to_style(style_id: str, images: List[UploadFile] = File(...)):
    """
    Add images to an existing style. Skips duplicates by content hash.
    Rebuilds embeddings after adding.
    """
    tmp_dir = None
    try:
        service = PipelineService()

        # Save uploaded files to temp directory
        tmp_dir = Path(tempfile.mkdtemp(prefix="swag_upload_"))
        saved_files: List[Path] = []
        for upload in images:
            suffix = Path(upload.filename or "image.png").suffix.lower()
            dest = tmp_dir / f"{len(saved_files)}{suffix}"
            with open(dest, "wb") as f:
                content = await upload.read()
                f.write(content)
            saved_files.append(dest)

        result = service.add_images_to_style(style_id, saved_files)
        return {"success": True, **result}

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if tmp_dir and tmp_dir.exists():
            shutil.rmtree(str(tmp_dir), ignore_errors=True)


@router.delete("/styles/{style_id}")
def delete_style(style_id: str):
    """
    Delete a style and all its associated reference images and embedding cache.
    """
    try:
        service = PipelineService()
        deleted_count = service.delete_style(style_id)
        return {
            "success": True,
            "message": f"Deleted style '{style_id}' and {deleted_count} reference images"
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/styles/{style_id}/images")
def delete_images_from_style(style_id: str, request: DeleteImagesRequest):
    """
    Delete specific reference images from a style.
    Rebuilds embeddings after deletion.
    """
    try:
        service = PipelineService()
        deleted_count = service.delete_images_from_style(style_id, request.filenames)
        return {
            "success": True,
            "deleted": deleted_count,
            "message": f"Deleted {deleted_count} image(s) from style '{style_id}'"
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
