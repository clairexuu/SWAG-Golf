"""Feedback endpoints for conversation context and summarization."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from api.services.pipeline import PipelineService

router = APIRouter()


class FeedbackRequest(BaseModel):
    """Request body for submitting feedback."""
    sessionId: str
    styleId: str
    feedback: str


class SummarizeRequest(BaseModel):
    """Request body for triggering feedback summarization."""
    sessionId: str
    styleId: str


@router.post("/feedback")
def submit_feedback(request: FeedbackRequest):
    """Submit designer feedback for the current session."""
    try:
        if not request.feedback or not request.feedback.strip():
            raise HTTPException(status_code=400, detail="Feedback cannot be empty")

        service = PipelineService()
        turn_number, was_summarized = service.add_feedback(
            session_id=request.sessionId,
            style_id=request.styleId,
            feedback=request.feedback,
        )

        return {
            "success": True,
            "turnNumber": turn_number,
            "summarized": was_summarized
        }

    except HTTPException:
        raise
    except Exception as e:
        return {
            "success": False,
            "error": {
                "code": "FEEDBACK_ERROR",
                "message": str(e)
            }
        }


@router.post("/feedback/summarize")
def summarize_feedback(request: SummarizeRequest):
    """Trigger GPT summarization of accumulated feedback and persist to style."""
    try:
        service = PipelineService()
        summary = service.summarize_feedback(
            session_id=request.sessionId,
            style_id=request.styleId
        )

        return {
            "success": True,
            "summary": summary
        }

    except Exception as e:
        return {
            "success": False,
            "error": {
                "code": "SUMMARIZE_ERROR",
                "message": str(e)
            }
        }
