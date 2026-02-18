"""
Google Gemini API Client - handles image generation using gemini-2.5-flash-image model.
Renamed from nano_banana_client.py but kept the class name for backwards compatibility.
"""
import os
import time
import base64
from io import BytesIO
from typing import List, Optional, Tuple
from concurrent.futures import ThreadPoolExecutor, as_completed
from google import genai
from google.genai import types
from PIL import Image


REFINE_SYSTEM_PROMPT = """You are a sketch editing assistant. You receive an existing sketch and modification instructions.
Your job is to take the given sketch and apply ONLY the requested modifications while preserving everything else.

RULES:
- GRAYSCALE ONLY — black, white, and gray tones only, no color
- Keep the overall composition, character, pose, and artistic style of the original sketch
- Apply ONLY the specific changes described in the instructions
- The result should look like the same sketch with the modifications drawn on top
- Maintain the same line weight, detail level, and technique
- Do NOT add elements that weren't requested
- Do NOT change aspects that weren't mentioned in the instructions
"""


SYSTEM_PROMPT = """You are a sketch assistant creating mascot/character patterns for apparel (polos, hats, bags).

**COLOR: GRAYSCALE ONLY (MANDATORY)**
- Black, white, and gray tones ONLY - NO color, tints, or sepia
- Pencil and ink sketch

**CHARACTER & COMPOSITION:**
- Character fills most of frame (close-up and cropped preferred)
- Natural action poses with believable body mechanics
- Clean/empty background - isolated design element, not a scene
- Exaggerated proportions for appeal

**STYLE:**
- Rough sketch with loose ink, thick outlines, minimal interior detail
- No gradients, textures, photorealism, or hatching
- High contrast, looks like a 10-15 min human sketch
- No text unless requested
"""


class NanaBananaClient:
    """Client for Google Gemini image generation (gemini-2.5-flash-image)."""

    def __init__(self, api_key: Optional[str] = None, model_name: Optional[str] = None):
        """
        Initialize Gemini client.

        Args:
            api_key: Google API key (defaults to GOOGLE_API_KEY env var)
            model_name: Model name (defaults to GEMINI_MODEL env var or gemini-2.5-flash-image)
        """
        self.api_key = api_key or os.getenv("GOOGLE_API_KEY") or os.getenv("NANO_BANANA_API_KEY")
        self.model_name = model_name or os.getenv("GEMINI_MODEL", "gemini-2.5-flash-image")

        if not self.api_key:
            raise ValueError("GOOGLE_API_KEY not found in environment")

        # Initialize Gemini client
        self.client = genai.Client(api_key=self.api_key)

    def generate(
        self,
        prompt: str,
        reference_images: List[str],
        num_images: int = 4,
        resolution: tuple = (1050, 1875),
        aspect_ratio: str = "9:16",
        image_size: str = "2K",
        seed: Optional[int] = None,
        temperature: float = 0.8
    ) -> Tuple[List[Optional[bytes]], List[Optional[str]]]:
        """
        Generate sketch images using Google Gemini 2.5 Flash Image model.

        Args:
            prompt: Text prompt for generation
            reference_images: List of reference image paths
            num_images: Number of images to generate
            resolution: (width, height) tuple
            aspect_ratio: Gemini aspect ratio preset ("1:1", "9:16", "16:9", etc.)
            image_size: Gemini image size preset ("1K", "2K", "4K")
            seed: Random seed for reproducibility (note: Gemini doesn't support seeds directly)
            temperature: Controls creativity (0.0-2.0). Lower = more deterministic, higher = more creative. Default 0.8

        Returns:
            Tuple of (image_data_list, errors_list). For each index:
              - Success: image_data_list[i] = bytes, errors_list[i] = None
              - Failure: image_data_list[i] = None, errors_list[i] = error message string
        """
        # Filter to valid reference image paths (limit to 5)
        valid_ref_paths = []
        for img_path in reference_images[:5]:
            try:
                Image.open(img_path).verify()
                valid_ref_paths.append(img_path)
            except Exception as e:
                print(f"Warning: Failed to load reference image {img_path}: {e}")

        # Build enhanced prompt with reference instruction
        # Note: style constraints are now in the prompt from format_prompt()
        enhanced_prompt = f"""
{prompt}

IMPORTANT OUTPUT REQUIREMENTS:
- Generate exactly 1 single design image (not multiple designs in one image)
- Match the layout, style, and technique shown in the reference images below
- Do NOT include any text, words, letters, or numbers in the generated image
- OUTPUT MUST BE BLACK AND WHITE / GRAYSCALE ONLY - NO COLOR
"""

        # Pre-load reference image bytes once (avoid redundant disk reads per thread)
        ref_image_bytes = []
        for p in valid_ref_paths:
            with open(p, 'rb') as f:
                ref_image_bytes.append(f.read())

        # Generate all images in parallel using threads
        # Each thread creates its own PIL Image from pre-loaded bytes (thread-safe)
        print(f"Generating {num_images} images in parallel...")
        with ThreadPoolExecutor(max_workers=num_images) as executor:
            futures = {
                executor.submit(
                    self._generate_single_image,
                    enhanced_prompt, ref_image_bytes, aspect_ratio, temperature, i
                ): i
                for i in range(num_images)
            }
            results = [None] * num_images
            errors = [None] * num_images
            for future in as_completed(futures):
                idx = futures[future]
                try:
                    results[idx] = future.result()
                except Exception as e:
                    errors[idx] = str(e)
                    print(f"Image {idx+1} failed: {e}")

        return results, errors

    def _generate_single_image(
        self,
        enhanced_prompt: str,
        ref_image_bytes: List[bytes],
        aspect_ratio: str,
        temperature: float,
        index: int
    ) -> bytes:
        """
        Generate a single image via the Gemini API.

        Each thread creates its own PIL Image objects from pre-loaded bytes
        to avoid thread-safety issues with shared PIL Images.

        Args:
            enhanced_prompt: The formatted prompt string
            ref_image_bytes: List of reference image data as bytes (pre-loaded)
            aspect_ratio: Gemini aspect ratio preset
            temperature: Generation temperature
            index: Image index (0-based, used for logging)

        Returns:
            Image data as bytes

        Raises:
            RuntimeError: If image generation fails after all retries
        """
        max_retries = 3
        for attempt in range(max_retries):
            try:
                # Create PIL Images from pre-loaded bytes (thread-safe)
                ref_parts = [Image.open(BytesIO(b)) for b in ref_image_bytes]
                contents = [enhanced_prompt] + ref_parts

                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=contents,
                    config=types.GenerateContentConfig(
                        systemInstruction=SYSTEM_PROMPT,
                        responseModalities=["IMAGE", "TEXT"],
                        temperature=temperature,
                        imageConfig=types.ImageConfig(
                            aspectRatio=aspect_ratio
                        )
                    )
                )

                if response.candidates and len(response.candidates) > 0:
                    candidate = response.candidates[0]
                    if hasattr(candidate, 'content') and candidate.content.parts:
                        for part in candidate.content.parts:
                            if os.getenv("DEBUG_GEMINI"):
                                print(f"  Debug: Part type={type(part).__name__}, attrs={[a for a in dir(part) if not a.startswith('_')]}")
                            if hasattr(part, 'inline_data') and part.inline_data:
                                img_data = part.inline_data.data

                                if isinstance(img_data, str):
                                    img_bytes = base64.b64decode(img_data)
                                else:
                                    img_bytes = img_data

                                if img_bytes and isinstance(img_bytes, bytes):
                                    if img_bytes.startswith(b'\x89PNG') or img_bytes.startswith(b'\xff\xd8\xff'):
                                        return img_bytes
                                    else:
                                        print(f"Warning: Invalid image format in response for iteration {index+1} (magic: {img_bytes[:4].hex() if len(img_bytes) >= 4 else 'too short'})")
                        raise RuntimeError(f"Gemini returned no image data for image {index+1}")
                    else:
                        raise RuntimeError(f"Gemini returned no content for image {index+1}")
                else:
                    raise RuntimeError(f"Gemini returned no candidates for image {index+1} - may have been blocked by safety filters")

            except RuntimeError:
                raise  # Don't retry our own errors from response validation above

            except Exception as e:
                error_msg = str(e)
                is_retryable = '503' in error_msg or '429' in error_msg or 'unavailable' in error_msg.lower()

                if is_retryable and attempt < max_retries - 1:
                    wait = 2 ** attempt  # 1s, 2s, 4s
                    print(f"Warning: Image {index+1} got transient error (attempt {attempt+1}/{max_retries}), retrying in {wait}s...")
                    time.sleep(wait)
                    continue

                if '429' in error_msg or 'quota' in error_msg.lower():
                    raise RuntimeError(f"API quota exceeded for image {index+1}. Check quota at https://ai.dev/rate-limit")
                else:
                    raise RuntimeError(f"Failed to generate image {index+1}: {e}")

    def refine(
        self,
        refine_prompt: str,
        original_context: str,
        refine_history: List[str],
        source_images: List[str],
        aspect_ratio: str = "9:16",
        temperature: float = 0.6,
    ) -> Tuple[List[Optional[bytes]], List[Optional[str]]]:
        """
        Refine existing sketch images by applying modification instructions.

        Each source image is refined independently (1:1 mapping).

        Args:
            refine_prompt: User's current modification instructions
            original_context: Original refined_intent from the initial generation
            refine_history: Previous refine prompts in order (for chaining)
            source_images: Paths to sketches to modify (1 output per source)
            aspect_ratio: Gemini aspect ratio preset
            temperature: Controls creativity (lower = more faithful edits)

        Returns:
            Tuple of (image_data_list, errors_list) with len == len(source_images)
        """
        # Build refine-specific enhanced prompt
        history_section = ""
        if refine_history:
            items = "\n".join(f"  {i+1}. {h}" for i, h in enumerate(refine_history))
            history_section = f"\nPREVIOUS REFINEMENTS ALREADY APPLIED:\n{items}\n"

        enhanced_prompt = f"""EXISTING SKETCH: The attached image is the sketch to modify.

ORIGINAL DESIGN CONTEXT: {original_context}
{history_section}
CURRENT MODIFICATION INSTRUCTIONS: {refine_prompt}

Apply ONLY the current modification instructions to the existing sketch.
{("The sketch may already reflect previous refinements — do not undo them." if refine_history else "")}
Output a single modified sketch. GRAYSCALE ONLY — no color.
"""

        # Pre-load each source image as bytes
        source_image_bytes_list = []
        for p in source_images:
            try:
                with open(p, 'rb') as f:
                    source_image_bytes_list.append(f.read())
            except Exception as e:
                print(f"Warning: Failed to load source image {p}: {e}")
                source_image_bytes_list.append(None)

        num_images = len(source_images)
        print(f"Refining {num_images} image(s) in parallel...")

        with ThreadPoolExecutor(max_workers=max(num_images, 1)) as executor:
            futures = {}
            for i, img_bytes in enumerate(source_image_bytes_list):
                if img_bytes is None:
                    continue
                futures[executor.submit(
                    self._generate_single_image_refine,
                    enhanced_prompt, img_bytes, aspect_ratio, temperature, i
                )] = i

            results = [None] * num_images
            errors = [None] * num_images

            # Mark images that failed to load
            for i, img_bytes in enumerate(source_image_bytes_list):
                if img_bytes is None:
                    errors[i] = f"Failed to load source image: {source_images[i]}"

            for future in as_completed(futures):
                idx = futures[future]
                try:
                    results[idx] = future.result()
                except Exception as e:
                    errors[idx] = str(e)
                    print(f"Refine image {idx+1} failed: {e}")

        return results, errors

    def _generate_single_image_refine(
        self,
        enhanced_prompt: str,
        source_image_bytes: bytes,
        aspect_ratio: str,
        temperature: float,
        index: int
    ) -> bytes:
        """
        Refine a single image via the Gemini API.

        Args:
            enhanced_prompt: The refine prompt string
            source_image_bytes: The source sketch image data as bytes
            aspect_ratio: Gemini aspect ratio preset
            temperature: Generation temperature
            index: Image index (0-based, used for logging)

        Returns:
            Refined image data as bytes
        """
        max_retries = 3
        for attempt in range(max_retries):
            try:
                source_img = Image.open(BytesIO(source_image_bytes))
                contents = [enhanced_prompt, source_img]

                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=contents,
                    config=types.GenerateContentConfig(
                        systemInstruction=REFINE_SYSTEM_PROMPT,
                        responseModalities=["IMAGE", "TEXT"],
                        temperature=temperature,
                        imageConfig=types.ImageConfig(
                            aspectRatio=aspect_ratio
                        )
                    )
                )

                if response.candidates and len(response.candidates) > 0:
                    candidate = response.candidates[0]
                    if hasattr(candidate, 'content') and candidate.content.parts:
                        for part in candidate.content.parts:
                            if os.getenv("DEBUG_GEMINI"):
                                print(f"  Debug (refine): Part type={type(part).__name__}, attrs={[a for a in dir(part) if not a.startswith('_')]}")
                            if hasattr(part, 'inline_data') and part.inline_data:
                                img_data = part.inline_data.data

                                if isinstance(img_data, str):
                                    img_bytes = base64.b64decode(img_data)
                                else:
                                    img_bytes = img_data

                                if img_bytes and isinstance(img_bytes, bytes):
                                    if img_bytes.startswith(b'\x89PNG') or img_bytes.startswith(b'\xff\xd8\xff'):
                                        return img_bytes
                                    else:
                                        print(f"Warning: Invalid image format in refine response {index+1}")
                        raise RuntimeError(f"Gemini returned no image data for refine {index+1}")
                    else:
                        raise RuntimeError(f"Gemini returned no content for refine {index+1}")
                else:
                    raise RuntimeError(f"Gemini returned no candidates for refine {index+1}")

            except RuntimeError:
                raise

            except Exception as e:
                error_msg = str(e)
                is_retryable = '503' in error_msg or '429' in error_msg or 'unavailable' in error_msg.lower()

                if is_retryable and attempt < max_retries - 1:
                    wait = 2 ** attempt
                    print(f"Warning: Refine {index+1} got transient error (attempt {attempt+1}/{max_retries}), retrying in {wait}s...")
                    time.sleep(wait)
                    continue

                if '429' in error_msg or 'quota' in error_msg.lower():
                    raise RuntimeError(f"API quota exceeded for refine {index+1}. Check quota at https://ai.dev/rate-limit")
                else:
                    raise RuntimeError(f"Failed to refine image {index+1}: {e}")
