import os
import torch
from PIL import Image
from transformers import CLIPProcessor, CLIPModel, SiglipModel, SiglipImageProcessor, SiglipTokenizer
from typing import List, Optional
from .utils import normalize_vector


class ImageEmbedder:
    """
    Generates embeddings for images and text using CLIP or SigLIP.

    Uses vision-language models to generate semantic embeddings for both images
    and text queries. Embeddings are in a shared multimodal space, enabling
    text-image similarity comparison. Dimension varies by model (e.g., 512 for
    CLIP ViT-B/32, 768 for SigLIP base).
    """

    def __init__(self, model_name: Optional[str] = None):
        """
        Initialize the image/text embedder.

        Args:
            model_name: HuggingFace model identifier (uses CLIP_MODEL env var if not provided).
                        Supports CLIP and SigLIP models.
        """
        # Resolve model from environment or use default
        if model_name is None:
            model_name = os.getenv('CLIP_MODEL', 'openai/clip-vit-base-patch32')

        self.model_name = model_name
        self.is_siglip = 'siglip' in model_name.lower()

        # Load model and processor based on model type
        if self.is_siglip:
            print(f"Loading SigLIP model: {model_name}...")
            self.model = SiglipModel.from_pretrained(model_name)
            self.image_processor = SiglipImageProcessor.from_pretrained(model_name)
            self.tokenizer = SiglipTokenizer.from_pretrained(model_name)
            self.max_length = 64  # SigLIP's max token length
        else:
            print(f"Loading CLIP model: {model_name}...")
            self.model = CLIPModel.from_pretrained(model_name)
            self.processor = CLIPProcessor.from_pretrained(model_name)
            self.max_length = 77  # CLIP's max token length

        # Auto-detect embedding dimension from model config
        if self.is_siglip:
            self.embedding_dim = self.model.config.vision_config.hidden_size  # 768 for siglip-base
        else:
            self.embedding_dim = self.model.config.projection_dim  # 512 for clip-vit-base-patch32

        # Move to GPU if available
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model.to(self.device)
        self.model.eval()  # Set to evaluation mode

        print(f"✓ Embedding model loaded on {self.device} (dim={self.embedding_dim})")

    def embed_image(self, image_path: str) -> List[float]:
        """
        Generate embedding for a single image.

        Args:
            image_path: Path to the image file

        Returns:
            Normalized embedding vector (dimension depends on model)
        """
        # Load image
        image = Image.open(image_path).convert("RGB")

        # Preprocess image
        if self.is_siglip:
            inputs = self.image_processor(images=image, return_tensors="pt")
        else:
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
            image_features = outputs.pooler_output

        # Convert to list and normalize
        # image_features shape: (batch_size, hidden_size)
        # Extract first (only) embedding and convert to Python list
        embedding = image_features[0].cpu().numpy().tolist()
        return normalize_vector(embedding)

    def embed_text(self, text: str) -> List[float]:
        """
        Generate embedding for text query.

        Args:
            text: Text string to embed (e.g., design description)

        Returns:
            Normalized embedding vector (dimension depends on model)

        Raises:
            ValueError: If text is empty or None
        """
        # Validate input
        if not text or not text.strip():
            raise ValueError("Text input cannot be empty")

        # Tokenize text
        if self.is_siglip:
            inputs = self.tokenizer(
                text=text,
                return_tensors="pt",
                padding=True,
                truncation=True,
                max_length=self.max_length
            )
        else:
            inputs = self.processor(
                text=text,
                return_tensors="pt",
                padding=True,
                truncation=True,
                max_length=self.max_length
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
        # text_features shape: (batch_size, hidden_size)
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
        if self.is_siglip:
            inputs = self.tokenizer(
                text=valid_texts,
                return_tensors="pt",
                padding=True,
                truncation=True,
                max_length=self.max_length
            )
        else:
            inputs = self.processor(
                text=valid_texts,
                return_tensors="pt",
                padding=True,
                truncation=True,
                max_length=self.max_length
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
        if self.is_siglip:
            inputs = self.image_processor(images=images, return_tensors="pt")
        else:
            inputs = self.processor(images=images, return_tensors="pt", padding=True)
        inputs = {k: v.to(self.device) for k, v in inputs.items()}

        # Generate embeddings
        with torch.no_grad():
            image_features = self.model.get_image_features(**inputs)

        # Convert to lists and normalize
        embeddings = image_features.cpu().numpy().tolist()
        return [normalize_vector(emb) for emb in embeddings]
