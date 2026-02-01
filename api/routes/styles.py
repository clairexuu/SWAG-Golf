"""Styles endpoint - returns available styles from StyleRegistry."""

from fastapi import APIRouter, HTTPException

from api.services.pipeline import PipelineService
from api.utils.case_converter import convert_keys_to_camel

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
                "reference_images": [],  # Don't expose image paths to frontend
                "do_not_use": []
            }
            styles_data.append(convert_keys_to_camel(style_dict))

        return {"success": True, "styles": styles_data}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
