"""
Google Gemini API Client - handles image generation using gemini-2.5-flash-image model.
Renamed from nano_banana_client.py but kept the class name for backwards compatibility.
"""
import os
import base64
from typing import List, Optional
from google import genai
from google.genai import types
from PIL import Image


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
    ) -> List[bytes]:
        """
        Generate sketch images using Google Gemini 2.5 Flash Image model.

        Args:
            prompt: Text prompt for generation
            reference_images: List of reference image paths
            num_images: Number of images to generate
            resolution: (width, height) tuple (used for placeholder images)
            aspect_ratio: Gemini aspect ratio preset ("1:1", "9:16", "16:9", etc.)
            image_size: Gemini image size preset ("1K", "2K", "4K")
            seed: Random seed for reproducibility (note: Gemini doesn't support seeds directly)
            temperature: Controls creativity (0.0-2.0). Lower = more deterministic, higher = more creative. Default 0.8

        Returns:
            List of image data as bytes

        Raises:
            Exception: If API request fails
        """
        # Load reference images as PIL Images
        ref_parts = []
        for img_path in reference_images[:5]:  # Limit to 5 reference images
            try:
                # Load image as PIL Image
                img = Image.open(img_path)
                ref_parts.append(img)
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

        # Generate images one at a time (Gemini generates one image per call)
        generated_images = []

        for i in range(num_images):
            try:
                # Prepare content with prompt and reference images
                contents = [enhanced_prompt] + ref_parts

                # Generate image with image output modality and size config
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

                # Extract image from response
                if response.candidates and len(response.candidates) > 0:
                    candidate = response.candidates[0]
                    if hasattr(candidate, 'content') and candidate.content.parts:
                        for part in candidate.content.parts:
                            # Debug: show what's in the part
                            if os.getenv("DEBUG_GEMINI"):
                                print(f"  Debug: Part type={type(part).__name__}, attrs={[a for a in dir(part) if not a.startswith('_')]}")
                            # Check if part contains inline image data
                            if hasattr(part, 'inline_data') and part.inline_data:
                                img_data = part.inline_data.data

                                # Handle both raw bytes and base64-encoded strings
                                if isinstance(img_data, str):
                                    # If it's a string, assume it's base64-encoded
                                    img_bytes = base64.b64decode(img_data)
                                else:
                                    # If it's already bytes (standard for genai library), use directly
                                    img_bytes = img_data

                                # Validate image format (PNG or JPEG)
                                # PNG magic: 0x89504E47, JPEG magic: 0xFFD8FF
                                if img_bytes and isinstance(img_bytes, bytes):
                                    if img_bytes.startswith(b'\x89PNG') or img_bytes.startswith(b'\xff\xd8\xff'):
                                        generated_images.append(img_bytes)
                                        break
                                    else:
                                        print(f"Warning: Invalid image format in response for iteration {i+1} (magic: {img_bytes[:4].hex() if len(img_bytes) >= 4 else 'too short'})")
                        else:
                            # No inline data found, create placeholder
                            print(f"Warning: No image data in response for iteration {i+1}, creating placeholder")
                            generated_images.append(self._create_placeholder_image(resolution))
                    else:
                        print(f"Warning: No content in response for iteration {i+1}, creating placeholder")
                        generated_images.append(self._create_placeholder_image(resolution))
                else:
                    print(f"Warning: No candidates in response for iteration {i+1}, creating placeholder")
                    generated_images.append(self._create_placeholder_image(resolution))

            except Exception as e:
                error_msg = str(e)
                if '429' in error_msg or 'quota' in error_msg.lower():
                    print(f"Warning: Quota exceeded for image {i+1}. Creating placeholder.")
                    print("  Tip: Check your quota at https://ai.dev/rate-limit")
                else:
                    print(f"Warning: Failed to generate image {i+1}: {e}")
                # Create placeholder on failure
                generated_images.append(self._create_placeholder_image(resolution))

        return generated_images

    def _create_placeholder_image(self, resolution: tuple) -> bytes:
        """
        Create a placeholder image when generation fails.

        Args:
            resolution: (width, height) tuple

        Returns:
            PNG image as bytes
        """
        from io import BytesIO
        img = Image.new('RGB', resolution, color='lightgray')
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        return buffer.getvalue()
