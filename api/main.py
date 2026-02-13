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
    """Health check endpoint with path diagnostics."""
    cwd = str(Path.cwd())
    style_lib = Path("style/style_library")
    rag_dir = Path("rag/reference_images")
    return {
        "status": "ok",
        "service": "python-backend",
        "version": "1.0.0",
        "cwd": cwd,
        "style_library_exists": style_lib.exists(),
        "style_library_path": str(style_lib.resolve()),
        "rag_images_exists": rag_dir.exists(),
    }


# Mount routes
app.include_router(styles.router)
app.include_router(generate.router)
app.include_router(feedback.router)
app.include_router(generations.router)


@app.on_event("startup")
async def startup_event():
    """Initialize pipeline service on startup."""
    cwd = Path.cwd()
    print("=" * 60)
    print("SWAG-Golf Python API Server")
    print("=" * 60)
    print(f"Working directory: {cwd}")
    print(f"Server starting on http://localhost:8000")
    print("")

    # Verify critical directories exist
    critical_dirs = {
        "style/style_library": Path("style/style_library"),
        "rag/reference_images": Path("rag/reference_images"),
        "api": Path("api"),
    }
    for name, dir_path in critical_dirs.items():
        resolved = dir_path.resolve()
        if dir_path.exists():
            print(f"  [OK] {name}: {resolved}")
        else:
            print(f"  [MISSING] {name}: (expected at {resolved})")
            # Auto-create missing style_library so style creation doesn't fail
            if name == "style/style_library":
                dir_path.mkdir(parents=True, exist_ok=True)
                print(f"    -> Created {resolved}")

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
