# SWAG-Golf Setup Instructions

## Overview
This guide provides step-by-step instructions to set up and run the SWAG-Golf simplified pipeline with RAG, GPT prompt compilation, and Nano Banana image generation.

**Key simplifications**: No style selection, hardcoded visual rules, direct reference image folder.

---

## Prerequisites

- Python 3.8+
- OpenAI API key (for GPT-4 prompt compilation)
- Nano Banana API key (for image generation)
- ~5GB disk space (for PyTorch and CLIP models)
- 10 reference images for RAG

---

## Step 1: Install Dependencies

Install all required Python packages:

```bash
cd /Users/clairexu/Desktop/GitHub/SWAG-Golf

# Install dependencies
pip install torch torchvision transformers ftfy regex requests python-dotenv

# Or install from requirements.txt (if updated)
pip install -r requirements.txt
```

**Expected download size**: ~2-3GB (PyTorch + CLIP model weights)

**Installation time**: 5-10 minutes depending on internet speed

---

## Step 2: Configure Environment Variables

Create a `.env` file in the project root with your API keys:

```bash
# Copy the template
cp .env.template .env

# Then edit .env with your actual keys
nano .env
```

**Required `.env` contents**:
```bash
# OpenAI API for prompt compilation
OPENAI_API_KEY=sk-proj-your_actual_key_here

# Nano Banana API for image generation
NANO_BANANA_API_KEY=your_actual_nano_banana_key
NANO_BANANA_API_URL=https://api.nanobanana.ai/v1/generate

# Model configuration (optional, uses defaults if not set)
GPT_MODEL=gpt-4
CLIP_MODEL=openai/clip-vit-base-patch32
```

**Important**: Never commit `.env` to git. It's already in `.gitignore`.

---

## Step 3: Organize Reference Images

Create the reference images directory and add your 10 images:

```bash
# Create directory
mkdir -p rag/reference_images

# Copy your 10 reference images to this directory
# You can use any image format (.png, .jpg, .jpeg)
```

**Recommended naming**: `ref_001.png`, `ref_002.png`, ..., `ref_010.png` for clarity, but any filenames work.

**Verify your setup**:
```bash
ls rag/reference_images/
# Should list your 10 image files
```

---

## Step 4: Build RAG Index

Generate CLIP embeddings for all reference images:

```bash
python build_rag_index.py
```

**Expected output**:
```
Building RAG index with CLIP embeddings...
Loading CLIP model: openai/clip-vit-base-patch32...
✓ CLIP model loaded on cpu
Found 10 reference images
Generating CLIP embeddings...
  [1/10] ref_001.png
  [2/10] ref_002.png
  [3/10] ref_003.png
  ...
  [10/10] ref_010.png

✓ Embeddings saved to rag/cache/embeddings.json
✓ Total: 10 images indexed
✓ Embedding dimension: 512
```

**First run notes**:
- CLIP model will download ~350MB of model weights (cached for future use)
- Takes ~30-60 seconds total
- Creates `rag/cache/embeddings.json` with all embeddings

**Verify**:
```bash
ls rag/cache/
# Should show: embeddings.json

cat rag/cache/embeddings.json | head -20
# Should show JSON with embedding_dim: 512 and num_images: 10
```

---

## Step 5: Test RAG Retrieval

Test that the RAG system works correctly:

```bash
python test_rag_retrieval.py
```

**Expected output**:
```
Testing RAG retrieval system...
Loaded 10 image embeddings
Embedding model: openai/clip-vit-base-patch32
Embedding dimension: 512

Test query image: ref_001.png

Top 5 similar images:
  1. ref_001.png: 1.000
  2. ref_003.png: 0.847
  3. ref_007.png: 0.823
  4. ref_002.png: 0.801
  5. ref_009.png: 0.789

✓ RAG retrieval working correctly
Note: First result should be 1.000 (query image matches itself)
```

**What this tests**:
- ✓ Embeddings cache loads correctly
- ✓ CLIP model initializes
- ✓ Similarity computation works
- ✓ Ranking by similarity functions properly

---

## Step 6: Test Nano Banana API (Optional)

Test the Nano Banana API client in isolation:

```bash
python -c "
from generate.nano_banana_client import NanaBananaClient
from pathlib import Path

try:
    client = NanaBananaClient()
    refs = [str(p) for p in Path('rag/reference_images').glob('*.png')[:3]]
    images = client.generate(
        prompt='playful golf mascot, thick lines, black and white sketch',
        reference_images=refs,
        num_images=2
    )
    print(f'✓ Generated {len(images)} images successfully')
except Exception as e:
    print(f'WARNING: Nano Banana API test failed: {e}')
    print('Pipeline will use placeholder images instead')
"
```

**If successful**: Shows "✓ Generated 2 images successfully"

**If fails**: Pipeline will still work, but generate blank placeholder images instead of real sketches

---

## Step 7: Test Full Pipeline

Run the complete end-to-end pipeline:

```bash
python test_simple_pipeline.py
```

**Expected output**:
```
============================================================
SIMPLIFIED SWAG-GOLF PIPELINE TEST
============================================================

[1/4] Loading RAG embeddings...
✓ Loaded 10 reference images

[2/4] Compiling prompt with GPT...
✓ Compiled: A playful golf mascot character with thick black ink lines, minimal interior detail, loose sketch style, clean white background

[3/4] Retrieving reference images...
Loading CLIP model: openai/clip-vit-base-patch32...
✓ CLIP model loaded on cpu
✓ Retrieved 5 references
  1. ref_001.png (similarity: 1.000)
  2. ref_003.png (similarity: 0.847)
  3. ref_007.png (similarity: 0.823)
  4. ref_002.png (similarity: 0.801)
  5. ref_009.png (similarity: 0.789)

[4/4] Generating images...
✓ Nano Banana client initialized
Calling Nano Banana API...
  Prompt: A playful golf mascot character with thick black ink lines...
  References: 5
✓ Generated 4 images

✓ COMPLETE: 4 sketches generated
Output directory: generated_outputs/20260127_143045
Metadata: generated_outputs/20260127_143045/metadata.json

============================================================
Pipeline test completed successfully!
============================================================
```

**Pipeline stages**:
1. **Load RAG embeddings** - Reads cached CLIP embeddings
2. **Compile prompt** - Sends user input to GPT-4, receives structured prompt
3. **Retrieve references** - Uses CLIP to find top-5 similar reference images
4. **Generate images** - Sends prompt + references to Nano Banana, generates 4 sketches

**Output verification**:
```bash
# Check output directory
ls generated_outputs/20260127_143045/

# Should contain:
# - sketch_0.png
# - sketch_1.png
# - sketch_2.png
# - sketch_3.png
# - metadata.json

# View metadata
cat generated_outputs/20260127_143045/metadata.json
```

---

## Files You Need to Run

### One-time setup files (run once):
1. **`build_rag_index.py`** - Generate CLIP embeddings for reference images
   - Run after adding/changing reference images
   - Creates `rag/cache/embeddings.json`

### Test files (run as needed):
2. **`test_rag_retrieval.py`** - Test RAG retrieval independently
   - Verifies embeddings and similarity computation

3. **`test_simple_pipeline.py`** - Test complete end-to-end pipeline
   - Full integration test with GPT + RAG + Nano Banana

---

## Pipeline Architecture

```
User Input (natural language)
         ↓
    GPT-4 Prompt Compiler
    (hardcoded visual rules)
         ↓
    Structured Prompt + Constraints
         ↓
    RAG Retrieval System
    (CLIP embeddings, cosine similarity)
         ↓
    Top-5 Reference Images
         ↓
    Nano Banana API
    (prompt + 5 refs → 4 sketches)
         ↓
    Generated Outputs
    (timestamped directory with images + metadata)
```

---

## Troubleshooting

### Issue: `OPENAI_API_KEY not found`
**Solution**:
- Verify `.env` file exists in project root
- Check that `OPENAI_API_KEY=` line has your actual API key (not the placeholder)
- Restart your shell or reload environment: `source .env`

### Issue: `CLIP model download fails`
**Solution**:
- Check internet connection
- Retry: `python build_rag_index.py`
- Manual download: Run `python -c "from transformers import CLIPModel; CLIPModel.from_pretrained('openai/clip-vit-base-patch32')"`

### Issue: `No images found in rag/reference_images/`
**Solution**:
- Verify directory exists: `mkdir -p rag/reference_images`
- Check that you copied your 10 images to this directory
- Supported formats: `.png`, `.jpg`, `.jpeg`

### Issue: `Nano Banana API fails`
**Solution**:
- Check `NANO_BANANA_API_KEY` in `.env`
- Verify `NANO_BANANA_API_URL` is correct
- Pipeline will fall back to placeholder images (blank gray squares)
- Adjust `generate/nano_banana_client.py` payload if API format differs

### Issue: `Embedding dimension mismatch`
**Solution**:
- Delete cache: `rm -rf rag/cache/*`
- Rebuild index: `python build_rag_index.py`

### Issue: `Out of memory (CLIP)`
**Solution**:
- CLIP is running on CPU by default (slower but works)
- If still failing, reduce batch size in embedder or process images one at a time
- Close other memory-intensive applications

---

## Cost Estimates

### Per Pipeline Run:
- **OpenAI GPT-4**: ~$0.01 per prompt compilation
  - System prompt: ~600 tokens
  - User prompt: ~200 tokens
  - Response: ~300 tokens

- **CLIP**: $0 (local inference)

- **Nano Banana**: Varies by API pricing
  - Typical image generation APIs: $0.01-0.10 per image
  - 4 images per run: $0.04-0.40

### Monthly (100 design iterations):
- OpenAI: $1-2
- Nano Banana: $4-40
- **Total: $5-42/month**

---

## Key Files Reference

### Created files:
- [.env.template](.env.template) - Template for environment variables
- [generate/nano_banana_client.py](generate/nano_banana_client.py) - Nano Banana API client
- [build_rag_index.py](build_rag_index.py) - Build CLIP embeddings
- [test_rag_retrieval.py](test_rag_retrieval.py) - Test RAG system
- [test_simple_pipeline.py](test_simple_pipeline.py) - End-to-end test

### Modified files:
- [rag/embedder.py](rag/embedder.py) - CLIP integration (replaced placeholder)
- [prompt/system_prompt.txt](prompt/system_prompt.txt) - Added visual rules
- [prompt/compiler.py](prompt/compiler.py) - Added `compile_simple()` method
- [generate/nano_banana.py](generate/nano_banana.py) - Integrated API client
- [generate/generator.py](generate/generator.py) - Added `generate_simple()` method

### Reference images location:
- **`rag/reference_images/`** - Your 10 images go here

### Cache location:
- **`rag/cache/embeddings.json`** - CLIP embeddings cache (auto-generated)

### Output location:
- **`generated_outputs/{timestamp}/`** - Generated sketches + metadata

---

## Next Steps

After completing setup:

1. **Add your reference images** to `rag/reference_images/`
2. **Build the RAG index** with `python build_rag_index.py`
3. **Test the pipeline** with `python test_simple_pipeline.py`
4. **Integrate into your workflow** - modify `test_simple_pipeline.py` for custom prompts
5. **Adjust Nano Banana client** payload in `generate/nano_banana_client.py` based on actual API docs

---

## Configuration Reference

### Environment Variables (.env file)

All model selections are configured in the `.env` file:

- **`OPENAI_API_KEY`** - OpenAI API key for GPT prompt compilation (required)
- **`GOOGLE_API_KEY`** - Google Gemini API key for image generation (required)
- **`GPT_MODEL`** - GPT model for prompt compilation (default: `gpt-4`)
  - Examples: `gpt-4o`, `gpt-4-turbo`, `gpt-3.5-turbo`
- **`CLIP_MODEL`** - CLIP model for RAG embeddings (default: `openai/clip-vit-base-patch32`)
  - Examples: `openai/clip-vit-large-patch14`, any HuggingFace CLIP identifier
- **`GEMINI_MODEL`** - Gemini model for image generation (default: `gemini-2.5-flash-image`)
  - Examples: `gemini-3-pro-image-preview` for higher quality

To change models, edit the `.env` file and restart your pipeline.

### Code-Level Configuration Constants

Some parameters are defined as constants in the source code for easy modification:

**Prompt Compilation** ([prompt/compiler.py](prompt/compiler.py)):
- **`TEMPERATURE = 0.7`** - GPT temperature for prompt compilation (line ~10)
  - Controls creativity vs consistency in prompt interpretation
  - Range: 0.0 (deterministic) to 2.0 (very creative)
  - Recommended: 0.6-0.8 for design prompts

To modify these values, edit the constants at the top of the respective Python files.

---

## Notes

- Visual/Practical rules are hardcoded in [prompt/system_prompt.txt](prompt/system_prompt.txt)
- No style selection required - simplified pipeline
- Graceful fallback to placeholder images if Nano Banana API fails
- All CLIP embeddings cached - only computed once
- Pipeline is pure Python (no frontend integration yet)

---

## Support

For issues or questions:
- Check [design_doc/Overview.md](design_doc/Overview.md) for architecture overview
- Review [design_doc/RAG.md](design_doc/RAG.md) for RAG system details
- Review [design_doc/Image_Generation.md](design_doc/Image_Generation.md) for generation details
- Check the approved plan at `.claude/plans/jolly-conjuring-toast.md`
