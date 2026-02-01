"""Pipeline service that orchestrates the generation workflow."""

import os
from typing import List, Tuple
from dotenv import load_dotenv

from style.registry import StyleRegistry
from style.types import Style
from prompt.compiler import PromptCompiler
from prompt.schema import PromptSpec
from rag.embedder import ImageEmbedder
from rag.index import IndexRegistry
from rag.retriever import ImageRetriever
from rag.types import RetrievalResult
from generate.generator import ImageGenerator
from generate.types import GenerationConfig, GenerationResult


class PipelineService:
    """
    Singleton service that wraps all backend components.
    Initialized once at startup for performance.
    """

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def _initialize(self):
        """Lazy initialization of pipeline components."""
        if self._initialized:
            return

        load_dotenv()

        # Initialize style registry
        self.style_registry = StyleRegistry()

        # Initialize prompt compiler
        gpt_model = os.getenv("GPT_MODEL", "gpt-4o")
        self.compiler = PromptCompiler(model=gpt_model)

        # Initialize RAG components
        self.embedder = ImageEmbedder()
        self.index_registry = IndexRegistry(
            self.style_registry,
            self.embedder,
            cache_dir="rag/cache"
        )
        self.retriever = ImageRetriever(self.index_registry, self.embedder)

        # Initialize image generator
        self.generator = ImageGenerator()

        self._initialized = True

    def get_all_styles(self) -> List[Style]:
        """Return all available styles from the registry."""
        self._initialize()
        return self.style_registry.get_all_styles()

    def get_style(self, style_id: str) -> Style:
        """Return a specific style by ID."""
        self._initialize()
        return self.style_registry.get_style(style_id)

    def generate(
        self,
        user_input: str,
        style_id: str,
        num_images: int = 4
    ) -> Tuple[GenerationResult, PromptSpec, RetrievalResult, Style]:
        """
        Run the full generation pipeline.

        Args:
            user_input: Natural language description from the user
            style_id: ID of the style to use
            num_images: Number of images to generate

        Returns:
            Tuple of (GenerationResult, PromptSpec, RetrievalResult, Style)
        """
        self._initialize()

        # Step 1: Get style
        style = self.style_registry.get_style(style_id)

        # Step 2: Compile prompt with GPT
        prompt_spec = self.compiler.compile(user_input, style)

        # Step 3: Retrieve reference images
        retrieval_result = self.retriever.retrieve(prompt_spec, style, top_k=5)

        # Step 4: Generate images
        config = GenerationConfig(
            num_images=num_images,
            resolution=(1024, 1024),
            output_dir="generated_outputs"
        )

        result = self.generator.generate(
            prompt_spec=prompt_spec,
            retrieval_result=retrieval_result,
            style=style,
            config=config
        )

        return result, prompt_spec, retrieval_result, style
