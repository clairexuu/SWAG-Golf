import os
import torch
from PIL import Image
from transformers import CLIPProcessor, CLIPModel
from typing import List, Optional
from .utils import normalize_vector


class ImageEmbedder:
    """
    Generates embeddings for images and text using CLIP.

    Uses OpenAI's CLIP model to generate semantic embeddings for both images
    and text queries. Embeddings are 512-dimensional vectors (for ViT-B/32)
    in a shared multimodal space, enabling text-image similarity comparison.
    """

    def __init__(self, model_name: Optional[str] = None, embedding_dim: int = 512):
        """
        Initialize the CLIP embedder.

        Args:
            model_name: HuggingFace model identifier for CLIP (uses CLIP_MODEL env var if not provided)
            embedding_dim: Dimension of embedding vectors (512 for CLIP ViT-B/32)
        """
        # Resolve model from environment or use default
        if model_name is None:
            model_name = os.getenv('CLIP_MODEL', 'openai/clip-vit-base-patch32')

        self.model_name = model_name
        self.embedding_dim = embedding_dim

        # Load CLIP model and processor
        print(f"Loading CLIP model: {model_name}...")
        self.model = CLIPModel.from_pretrained(model_name)
        self.processor = CLIPProcessor.from_pretrained(model_name)

        # Move to GPU if available
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model.to(self.device)
        self.model.eval()  # Set to evaluation mode

        print(f"✓ CLIP model loaded on {self.device}")

    def embed_image(self, image_path: str) -> List[float]:
        """
        Generate CLIP embedding for a single image.

        Args:
            image_path: Path to the image file

        Returns:
            Normalized embedding vector (512-dimensional for ViT-B/32)
        """
        # Load image
        image = Image.open(image_path).convert("RGB")

        # Preprocess image
        inputs = self.processor(images=image, return_tensors="pt")
        inputs = {k: v.to(self.device) for k, v in inputs.items()}

        # Generate embedding
        with torch.no_grad():
            outputs = self.model.get_image_features(**inputs)

        # Handle different transformers versions
        # Newer versions return BaseModelOutputWithPooling, older return tensor directly
        if isinstance(outputs, torch.Tensor):
            image_features = outputs
        else:
            # BaseModelOutputWithPooling - get pooler_output which is the image embedding
            # pooler_output shape: (batch_size, hidden_size) = (1, 512)
            image_features = outputs.pooler_output

        # Convert to list and normalize
        # image_features shape: (batch_size, hidden_size) = (1, 512)
        # Extract first (only) embedding and convert to Python list
        embedding = image_features[0].cpu().numpy().tolist()
        return normalize_vector(embedding)

    def embed_text(self, text: str) -> List[float]:
        """
        Generate CLIP embedding for text query.

        Args:
            text: Text string to embed (e.g., design description)

        Returns:
            Normalized embedding vector (512-dimensional for ViT-B/32)

        Raises:
            ValueError: If text is empty or None
        """
        # Validate input
        if not text or not text.strip():
            raise ValueError("Text input cannot be empty")

        # Tokenize text
        inputs = self.processor(
            text=text,
            return_tensors="pt",
            padding=True,
            truncation=True,
            max_length=77  # CLIP's max token length
        )
        inputs = {k: v.to(self.device) for k, v in inputs.items()}

        # Generate embedding
        with torch.no_grad():
            outputs = self.model.get_text_features(**inputs)

        # Handle different transformers versions (same as image embedding)
        if isinstance(outputs, torch.Tensor):
            text_features = outputs
        else:
            # BaseModelOutputWithPooling - get pooler_output
            text_features = outputs.pooler_output

        # Convert to list and normalize
        # text_features shape: (batch_size, hidden_size) = (1, 512)
        embedding = text_features[0].cpu().numpy().tolist()
        return normalize_vector(embedding)

    def embed_text_batch(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for multiple text strings efficiently.

        Args:
            texts: List of text strings to embed

        Returns:
            List of normalized embedding vectors

        Raises:
            ValueError: If texts list is empty or contains only empty strings
        """
        # Validate input
        if not texts:
            raise ValueError("Texts list cannot be empty")

        valid_texts = [t.strip() for t in texts if t and t.strip()]
        if not valid_texts:
            raise ValueError("All text strings are empty")

        # Batch tokenization
        inputs = self.processor(
            text=valid_texts,
            return_tensors="pt",
            padding=True,
            truncation=True,
            max_length=77
        )
        inputs = {k: v.to(self.device) for k, v in inputs.items()}

        # Generate embeddings
        with torch.no_grad():
            outputs = self.model.get_text_features(**inputs)

        # Handle different transformers versions
        if isinstance(outputs, torch.Tensor):
            text_features = outputs
        else:
            # BaseModelOutputWithPooling - get pooler_output
            text_features = outputs.pooler_output

        # Convert to lists and normalize
        embeddings = text_features.cpu().numpy().tolist()
        return [normalize_vector(emb) for emb in embeddings]

    def embed_batch(self, image_paths: List[str]) -> List[List[float]]:
        """
        Generate embeddings for multiple images efficiently.

        Args:
            image_paths: List of paths to image files

        Returns:
            List of normalized embedding vectors
        """
        # Load all images
        images = [Image.open(path).convert("RGB") for path in image_paths]

        # Batch preprocessing
        inputs = self.processor(images=images, return_tensors="pt", padding=True)
        inputs = {k: v.to(self.device) for k, v in inputs.items()}

        # Generate embeddings
        with torch.no_grad():
            image_features = self.model.get_image_features(**inputs)

        # Convert to lists and normalize
        embeddings = image_features.cpu().numpy().tolist()
        return [normalize_vector(emb) for emb in embeddings]
