"""Generations history endpoint - returns all past generation metadata."""

import json
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from api.utils.case_converter import convert_keys_to_camel

router = APIRouter()

GENERATED_DIR = Path("generated_outputs")


@router.get("/generations")
def list_generations(
    style_id: Optional[str] = Query(None, alias="styleId"),
):
    """
    Scan generated_outputs/ and return metadata for all generations.

    Supports optional filtering by styleId.
    Returns newest-first ordering.
    """
    try:
        if not GENERATED_DIR.exists():
            return {"success": True, "total": 0, "generations": []}

        generations = []
        for entry in sorted(GENERATED_DIR.iterdir(), reverse=True):
            if not entry.is_dir():
                continue
            metadata_path = entry / "metadata.json"
            if not metadata_path.exists():
                continue

            try:
                with open(metadata_path, "r") as f:
                    meta = json.load(f)
            except (json.JSONDecodeError, IOError):
                continue

            # Normalize legacy vs current schema
            user_prompt = meta.get("user_prompt") or meta.get("prompt", "")
            if not user_prompt:
                continue

            style_info = meta.get("style", {"id": "unknown", "name": "Unknown"})
            images = meta.get("images", [])

            # Filter by style if requested
            if style_id and style_info.get("id") != style_id:
                continue

            generations.append({
                "timestamp": meta.get("timestamp", entry.name),
                "dir_name": entry.name,
                "user_prompt": user_prompt,
                "style": style_info,
                "image_count": len(images),
                "images": images,
            })

        # Cap at 100 most recent generations (per-style when filtered, global otherwise)
        generations = generations[:100]
        total = len(generations)

        return {
            "success": True,
            "total": total,
            "generations": [convert_keys_to_camel(g) for g in generations],
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
