import random
from typing import List
from .utils import normalize_vector


class ImageEmbedder:
    """
    Generates embeddings for reference images.

    PLACEHOLDER: Currently uses random vectors for testing.
    Replace with actual embedding model (CLIP, OpenAI, or custom vision model).
    """

    def __init__(self, model_name: str = "placeholder", embedding_dim: int = 768):
        """
        Initialize the embedder.

        Args:
            model_name: Name of the embedding model (currently placeholder)
            embedding_dim: Dimension of embedding vectors (768 matches CLIP/common models)
        """
        self.model_name = model_name
        self.embedding_dim = embedding_dim

        # TODO: Initialize actual embedding model here
        # Example for CLIP:
        # from transformers import CLIPProcessor, CLIPModel
        # self.model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
        # self.processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

    def embed_image(self, image_path: str) -> List[float]:
        """
        Generate embedding for a single image.

        PLACEHOLDER: Returns random normalized vector.

        Args:
            image_path: Path to the image file

        Returns:
            Normalized embedding vector

        TODO: Replace with actual embedding logic:
        # from PIL import Image
        # image = Image.open(image_path)
        # inputs = self.processor(images=image, return_tensors="pt")
        # outputs = self.model.get_image_features(**inputs)
        # embedding = outputs[0].detach().numpy().tolist()
        # return normalize_vector(embedding)
        """
        # Generate random vector
        vector = [random.random() for _ in range(self.embedding_dim)]
        # Normalize to unit length
        return normalize_vector(vector)

    def embed_batch(self, image_paths: List[str]) -> List[List[float]]:
        """
        Generate embeddings for multiple images.

        PLACEHOLDER: Calls embed_image for each path.

        Args:
            image_paths: List of paths to image files

        Returns:
            List of normalized embedding vectors

        TODO: Implement efficient batch processing:
        # from PIL import Image
        # images = [Image.open(path) for path in image_paths]
        # inputs = self.processor(images=images, return_tensors="pt", padding=True)
        # outputs = self.model.get_image_features(**inputs)
        # embeddings = outputs.detach().numpy().tolist()
        # return [normalize_vector(emb) for emb in embeddings]
        """
        return [self.embed_image(path) for path in image_paths]
