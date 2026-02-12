"""FastAPI server for SWAG-Golf Python backend."""

import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from api.routes import styles, generate, feedback, generations

app = FastAPI(
    title="SWAG-Golf Python API",
    description="Backend API for sketch generation pipeline",
    version="1.0.0"
)

# CORS - allow Express API to access this server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3001",  # Express API
        "http://localhost:5173",  # Frontend (for direct access during dev)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount generated images as static files
generated_dir = Path("generated_outputs")
if generated_dir.exists():
    app.mount("/generated", StaticFiles(directory=str(generated_dir)), name="generated")

# Mount reference images as static files
reference_images_dir = Path("rag/reference_images")
if reference_images_dir.exists():
    app.mount("/reference-images", StaticFiles(directory=str(reference_images_dir)), name="reference-images")


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "python-backend",
        "version": "1.0.0"
    }


# Mount routes
app.include_router(styles.router)
app.include_router(generate.router)
app.include_router(feedback.router)
app.include_router(generations.router)


@app.on_event("startup")
async def startup_event():
    """Initialize pipeline service on startup."""
    print("=" * 60)
    print("SWAG-Golf Python API Server")
    print("=" * 60)
    print("Server starting on http://localhost:8000")
    print("")
    print("Available endpoints:")
    print("  GET  http://localhost:8000/health")
    print("  GET  http://localhost:8000/styles")
    print("  POST http://localhost:8000/generate")
    print("  POST http://localhost:8000/feedback")
    print("  POST http://localhost:8000/feedback/summarize")
    print("  GET  http://localhost:8000/generations")
    print("  GET  http://localhost:8000/generated/{path} (static files)")
    print("=" * 60)

    # Ensure output directory exists
    generated_dir.mkdir(exist_ok=True)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
