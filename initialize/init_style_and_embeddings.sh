#!/bin/bash
# ============================================
# Style & Embedding Initialization Script
# ============================================
# This script creates/updates a style and builds its embeddings.
# Run from project root: ./initialize/init_style_and_embeddings.sh
#
# ============================================
# Configuration - Edit these values
# ============================================

STYLE_ID="my-style"
STYLE_NAME="My Style"
STYLE_DESCRIPTION="Description of the style"
IMAGES_FOLDER="/path/to/images"

# Mode: "create" for new style, "add-images" to add to existing style
MODE="create"

# Optional: path to visual rules JSON file (only used for "create" mode)
# Leave empty to use defaults
VISUAL_RULES=""

# ============================================
# Script execution - Don't edit below
# ============================================

set -e  # Exit on error

# Get script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo "=== Style & Embedding Initialization ==="
echo "Project root: $PROJECT_ROOT"
echo "Style ID: $STYLE_ID"
echo "Mode: $MODE"
echo ""

# Activate virtual environment
if [ -f ".venv/bin/activate" ]; then
    source .venv/bin/activate
    echo "Activated virtual environment"
else
    echo "ERROR: Virtual environment not found at .venv/"
    echo "Please create it first: python -m venv .venv && pip install -r requirements.txt"
    exit 1
fi

# Step 1: Run init_style.py
echo ""
echo "=== Step 1: Initializing Style ==="

if [ "$MODE" = "create" ]; then
    if [ -n "$VISUAL_RULES" ]; then
        python style/init_style.py create \
            --name "$STYLE_NAME" \
            --description "$STYLE_DESCRIPTION" \
            --images "$IMAGES_FOLDER" \
            --style-id "$STYLE_ID" \
            --visual-rules "$VISUAL_RULES"
    else
        python style/init_style.py create \
            --name "$STYLE_NAME" \
            --description "$STYLE_DESCRIPTION" \
            --images "$IMAGES_FOLDER" \
            --style-id "$STYLE_ID"
    fi
elif [ "$MODE" = "add-images" ]; then
    python style/init_style.py add-images \
        --style-id "$STYLE_ID" \
        --images "$IMAGES_FOLDER"
else
    echo "ERROR: Invalid MODE '$MODE'. Use 'create' or 'add-images'"
    exit 1
fi

# Step 2: Run init_embeddings.py
echo ""
echo "=== Step 2: Building Embeddings ==="

python -m rag.init_embeddings --style "$STYLE_ID" --force

echo ""
echo "=== Done ==="
echo "Style '$STYLE_ID' is ready for retrieval."
