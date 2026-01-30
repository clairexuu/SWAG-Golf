# SWAG-Golf Backend Setup

## Overview

This guide covers setting up the Python backend for SWAG-Golf, including dependencies, environment configuration, and style/embedding initialization.

---

## Prerequisites

- Python 3.8+
- ~5GB disk space (PyTorch + CLIP model weights)
- OpenAI API key (for GPT prompt compilation)
- Google Gemini API key (for image generation)

---

## Step 1: Install Dependencies

```bash
# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

---

## Step 2: Configure Environment

Create a `.env` file in the project root:

```bash
OPENAI_API_KEY=your_openai_key
GOOGLE_API_KEY=your_google_gemini_key
```

Optional configuration (defaults shown):
```bash
GPT_MODEL=gpt-4o
CLIP_MODEL=openai/clip-vit-base-patch32
GEMINI_MODEL=gemini-2.5-flash-image
```

---

## Step 3: Initialize Style & Embeddings

Edit `initialize/init_style_and_embeddings.sh` to configure your style:

```bash
STYLE_ID="my-style"
STYLE_NAME="My Style"
STYLE_DESCRIPTION="Description of the style"
IMAGES_FOLDER="/path/to/reference/images"
MODE="create"  # or "add-images" to add to existing style
```

Run the initialization:
```bash
./initialize/init_style_and_embeddings.sh
```

This script:
1. Creates the style configuration in `style/style_library/`
2. Copies reference images to `rag/reference_images/`
3. Builds CLIP embeddings and caches them in `rag/cache/`

---

## Step 4: Verify Setup

```bash
python test_pipeline.py
```

A successful run will generate output images in `generated_outputs/`.

---

## Configuration Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | Yes | - | OpenAI API key for GPT |
| `GOOGLE_API_KEY` | Yes | - | Google Gemini API key |
| `GPT_MODEL` | No | `gpt-4o` | GPT model for prompt compilation |
| `CLIP_MODEL` | No | `openai/clip-vit-base-patch32` | CLIP model for embeddings |
| `GEMINI_MODEL` | No | `gemini-2.5-flash-image` | Gemini model for generation |
