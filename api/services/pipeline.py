"""Pipeline service that orchestrates the generation workflow."""

import asyncio
import json
import os
from datetime import datetime
from pathlib import Path
from typing import Any, AsyncGenerator, Dict, List, Optional, Tuple
from dotenv import load_dotenv

from style.registry import StyleRegistry
from style.types import Style
from style.init_style import delete_style as fs_delete_style
from style.init_style import delete_images_from_style as fs_delete_images_from_style
from style.init_style import add_images_to_existing_style
from style.init_style import create_new_style, slugify, DEFAULT_VISUAL_RULES
from style.init_style import update_style_json
from prompt.compiler import PromptCompiler
from prompt.schema import PromptSpec
from rag.embedder import ImageEmbedder
from rag.index import IndexRegistry
from rag.retriever import ImageRetriever
from rag.types import RetrievalResult
from generate.generator import ImageGenerator
from generate.types import GenerationConfig, GenerationResult
from feedback.session import SessionStore, ConversationTurn
from feedback.logger import ConversationLogger


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
        gpt_model = os.getenv("GPT_MODEL", "gpt-4o-mini")
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

        # Initialize session and feedback logging
        self.session_store = SessionStore()
        self.conversation_logger = ConversationLogger()

        self._initialized = True

    def get_all_styles(self) -> List[Style]:
        """Return all available styles from the registry."""
        self._initialize()
        return self.style_registry.get_all_styles()

    def get_style(self, style_id: str) -> Style:
        """Return a specific style by ID."""
        self._initialize()
        return self.style_registry.get_style(style_id)

    def create_style(
        self,
        name: str,
        description: str,
        visual_rules: Dict[str, Any],
        image_files: Optional[List[Path]] = None,
    ) -> Style:
        """
        Create a new style and optionally build embeddings for its images.

        Returns:
            The created Style object
        """
        self._initialize()

        style_id = slugify(name)

        # Merge provided rules with defaults
        merged_rules = {**DEFAULT_VISUAL_RULES, **visual_rules}
        if "additional_rules" not in merged_rules:
            merged_rules["additional_rules"] = {}

        # Create style on disk (dir, move images, write style.json)
        create_new_style(
            style_id=style_id,
            name=name,
            description=description,
            image_files=image_files or [],
            visual_rules=merged_rules,
        )

        # Build embeddings if images were provided
        if image_files:
            index = self.index_registry.get_index(style_id)
            index.build_index()

        return self.style_registry.get_style(style_id)

    def delete_style(self, style_id: str) -> int:
        """
        Delete a style, its reference images, and embedding cache.

        Returns:
            Number of reference images deleted
        """
        self._initialize()

        # Clear registry cache
        self.style_registry.delete_style(style_id)

        # Clear embedding cache
        if style_id in self.index_registry._indices:
            self.index_registry._indices[style_id].clear_cache()
            del self.index_registry._indices[style_id]
        else:
            # Clear cache file directly even if index wasn't loaded
            from rag.index import StyleImageIndex
            temp_index = StyleImageIndex(
                style_id=style_id,
                style_registry=self.style_registry,
                embedder=self.embedder,
                cache_dir="rag/cache"
            )
            temp_index.clear_cache()

        # Delete style directory and reference images from disk
        return fs_delete_style(style_id)

    def add_images_to_style(self, style_id: str, image_files: List[Path]) -> Dict[str, int]:
        """
        Add images to an existing style, rebuild embeddings.

        Returns:
            Dict with 'added' and 'skipped' counts
        """
        self._initialize()

        # Add images with dedup
        added, skipped = add_images_to_existing_style(style_id, image_files)

        # Clear registry cache so updated style is loaded on next access
        self.style_registry._cache.pop(style_id, None)

        # Rebuild embeddings for this style
        if added > 0:
            # Clear stale index cache
            if style_id in self.index_registry._indices:
                del self.index_registry._indices[style_id]
            index = self.index_registry.get_index(style_id)
            index.build_index()

        return {"added": added, "skipped": skipped}

    def delete_images_from_style(self, style_id: str, filenames: List[str]) -> int:
        """
        Delete specific images from a style, update style.json, rebuild embeddings.

        Returns:
            Number of images deleted from disk.
        """
        self._initialize()

        deleted_count = fs_delete_images_from_style(style_id, filenames)

        # Clear registry cache so updated style is loaded
        self.style_registry._cache.pop(style_id, None)

        # Rebuild embeddings if images were deleted
        if deleted_count > 0:
            if style_id in self.index_registry._indices:
                del self.index_registry._indices[style_id]
            # Reload style and rebuild if images remain
            style = self.style_registry.get_style(style_id)
            if style.reference_images:
                index = self.index_registry.get_index(style_id)
                index.build_index()

        return deleted_count

    def update_style(self, style_id: str, updates: Dict[str, Any]) -> Style:
        """
        Update style metadata (name, description, visual_rules) and return the updated Style.
        """
        self._initialize()

        update_style_json(style_id, updates)

        # Clear registry cache so next load picks up changes
        self.style_registry._cache.pop(style_id, None)

        return self.style_registry.get_style(style_id)

    def generate(
        self,
        user_input: str,
        style_id: str,
        num_images: int = 4,
        session_id: Optional[str] = None
    ) -> Tuple[GenerationResult, PromptSpec, RetrievalResult, Style]:
        """
        Run the full generation pipeline.

        Args:
            user_input: Natural language description from the user
            style_id: ID of the style to use
            num_images: Number of images to generate
            session_id: Optional session ID for conversation context

        Returns:
            Tuple of (GenerationResult, PromptSpec, RetrievalResult, Style)
        """
        self._initialize()

        # Step 1: Get style
        style = self.style_registry.get_style(style_id)

        # Step 2: Get conversation history if session exists
        # Exclude refine turns — they are irrelevant to new concept generation
        conversation_history = None
        context = None
        if session_id:
            context = self.session_store.get_or_create(session_id, style_id)
            if context.turn_count > 0:
                conversation_history = context.to_gpt_messages(exclude_roles=["refine"])

        # Step 3: Compile prompt with GPT (with conversation context)
        prompt_spec = self.compiler.compile(
            user_input, style,
            conversation_history=conversation_history
        )

        # Step 4: Retrieve reference images
        retrieval_result = self.retriever.retrieve(prompt_spec, style, top_k=3)

        # Step 5: Generate images
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

        # Step 6: Record generation turn in session
        if session_id and context is not None:
            turn = ConversationTurn(
                turn_number=context.turn_count + 1,
                role="generate",
                timestamp=result.timestamp,
                user_input=user_input,
                style_id=style_id,
                refined_intent=prompt_spec.refined_intent,
                negative_constraints=prompt_spec.negative_constraints,
                image_paths=result.images
            )
            context.add_turn(turn)
            self.conversation_logger.log_turn(session_id, style_id, turn.to_dict())

        return result, prompt_spec, retrieval_result, style

    async def generate_async(
        self,
        user_input: str,
        style_id: str,
        num_images: int = 4,
        session_id: Optional[str] = None
    ) -> Tuple[GenerationResult, PromptSpec, RetrievalResult, Style]:
        """Async version of generate(). Uses async Gemini calls for image generation."""
        self._initialize()

        style = self.style_registry.get_style(style_id)

        conversation_history = None
        context = None
        if session_id:
            context = self.session_store.get_or_create(session_id, style_id)
            if context.turn_count > 0:
                conversation_history = context.to_gpt_messages(exclude_roles=["refine"])

        # Prompt compilation (sync — runs in thread to avoid blocking event loop)
        prompt_spec = await asyncio.to_thread(
            self.compiler.compile,
            user_input, style,
            conversation_history
        )

        # RAG retrieval (sync — runs in thread)
        retrieval_result = await asyncio.to_thread(
            self.retriever.retrieve, prompt_spec, style, 3
        )

        # Image generation (async)
        config = GenerationConfig(
            num_images=num_images,
            resolution=(1024, 1024),
            output_dir="generated_outputs"
        )
        result = await self.generator.generate_async(
            prompt_spec=prompt_spec,
            retrieval_result=retrieval_result,
            style=style,
            config=config
        )

        # Record turn
        if session_id and context is not None:
            turn = ConversationTurn(
                turn_number=context.turn_count + 1,
                role="generate",
                timestamp=result.timestamp,
                user_input=user_input,
                style_id=style_id,
                refined_intent=prompt_spec.refined_intent,
                negative_constraints=prompt_spec.negative_constraints,
                image_paths=result.images
            )
            context.add_turn(turn)
            self.conversation_logger.log_turn(session_id, style_id, turn.to_dict())

        return result, prompt_spec, retrieval_result, style

    async def generate_streaming(
        self,
        user_input: str,
        style_id: str,
        num_images: int = 4,
        session_id: Optional[str] = None
    ) -> AsyncGenerator[dict, None]:
        """
        Streaming version of generate(). Yields SSE event dicts as each image completes.

        Events:
          {"event": "progress", "data": {"stage": "prompt_compiled", ...}}
          {"event": "progress", "data": {"stage": "rag_complete", ...}}
          {"event": "image", "data": {"index": 0, "sketch": {...}}}
          {"event": "complete", "data": {"timestamp": "...", ...}}
          {"event": "error", "data": {"message": "..."}}
        """
        self._initialize()

        style = self.style_registry.get_style(style_id)

        conversation_history = None
        context = None
        if session_id:
            context = self.session_store.get_or_create(session_id, style_id)
            if context.turn_count > 0:
                conversation_history = context.to_gpt_messages(exclude_roles=["refine"])

        # Step 1: Compile prompt
        prompt_spec = await asyncio.to_thread(
            self.compiler.compile,
            user_input, style,
            conversation_history
        )
        yield {
            "event": "progress",
            "data": {
                "stage": "prompt_compiled",
                "refinedIntent": prompt_spec.refined_intent
            }
        }

        # Step 2: RAG retrieval
        retrieval_result = await asyncio.to_thread(
            self.retriever.retrieve, prompt_spec, style, 3
        )
        yield {
            "event": "progress",
            "data": {
                "stage": "rag_complete",
                "referenceCount": len(retrieval_result.images)
            }
        }

        # Step 3: Stream images as they complete
        config = GenerationConfig(
            num_images=num_images,
            resolution=(1024, 1024),
            output_dir="generated_outputs"
        )

        from generate.types import GenerationPayload
        payload = GenerationPayload(
            prompt_spec=prompt_spec,
            retrieval_result=retrieval_result,
            config=config,
            style=style
        )

        image_paths: List[Optional[str]] = [None] * num_images
        image_errors: List[Optional[str]] = [None] * num_images
        completed_count = 0

        # Collect retry notifications and emit as SSE progress events
        retry_events = []

        def on_retry(index, attempt, max_retries):
            retry_events.append({"index": index, "attempt": attempt, "maxRetries": max_retries})

        async for idx, image_path, error in self.generator.generate_streaming_async(
            prompt_spec=prompt_spec,
            retrieval_result=retrieval_result,
            style=style,
            config=config,
            on_retry=on_retry
        ):
            # Drain any retry events accumulated since last image completed
            for info in retry_events:
                yield {
                    "event": "progress",
                    "data": {"stage": "retry", **info}
                }
            retry_events.clear()

            image_paths[idx] = image_path
            image_errors[idx] = error
            completed_count += 1

            if image_path is not None:
                rel_path = Path(image_path).relative_to(Path("generated_outputs").resolve())
                sketch_data = {
                    "id": f"stream_{idx}",
                    "resolution": list(config.resolution),
                    "imagePath": f"/generated/{rel_path}",
                    "metadata": {
                        "promptSpec": {
                            "intent": prompt_spec.intent,
                            "refinedIntent": prompt_spec.refined_intent,
                            "negativeConstraints": prompt_spec.negative_constraints or []
                        },
                        "referenceImages": [img.path for img in retrieval_result.images],
                        "retrievalScores": retrieval_result.scores
                    }
                }
                yield {
                    "event": "image",
                    "data": {"index": idx, "sketch": sketch_data}
                }
            else:
                yield {
                    "event": "image",
                    "data": {"index": idx, "sketch": None, "error": error}
                }

        # Step 4: Save metadata for all images
        from generate.utils import save_metadata, get_timestamp
        timestamp = get_timestamp()
        successful_paths = [p for p in image_paths if p is not None]
        if successful_paths:
            output_dir = os.path.dirname(successful_paths[0])
            metadata_dict = {
                "timestamp": timestamp,
                "archived": False,
                "user_prompt": prompt_spec.intent,
                "gpt_compiled_prompt": prompt_spec.refined_intent,
                "style": {"id": style.id, "name": style.name},
                "prompt_spec": prompt_spec.to_dict(),
                "reference_images": [img.path for img in retrieval_result.images],
                "retrieval_scores": retrieval_result.scores,
                "config": {
                    "num_images": config.num_images,
                    "resolution": list(config.resolution),
                    "model_name": config.model_name,
                    "seed": config.seed,
                    "aspect_ratio": config.aspect_ratio,
                    "image_size": config.image_size
                },
                "images": [os.path.basename(p) for p in successful_paths],
                "image_errors": [e for e in image_errors if e is not None]
            }
            save_metadata(metadata_dict, output_dir)

        # Step 5: Record turn
        if session_id and context is not None:
            turn = ConversationTurn(
                turn_number=context.turn_count + 1,
                role="generate",
                timestamp=timestamp,
                user_input=user_input,
                style_id=style_id,
                refined_intent=prompt_spec.refined_intent,
                negative_constraints=prompt_spec.negative_constraints,
                image_paths=image_paths
            )
            context.add_turn(turn)
            self.conversation_logger.log_turn(session_id, style_id, turn.to_dict())

        yield {
            "event": "complete",
            "data": {
                "timestamp": timestamp,
                "totalImages": num_images,
                "successCount": len(successful_paths),
                "styleId": style.id
            }
        }

    def refine(
        self,
        refine_prompt: str,
        selected_image_paths: List[str],
        style_id: str,
        session_id: Optional[str] = None,
    ) -> Tuple[GenerationResult, Style]:
        """
        Refine existing sketch images by applying modification instructions.

        Skips GPT prompt compilation and RAG retrieval — uses the original
        generation's context and sends selected images directly to Gemini
        with an editing-focused prompt.

        Args:
            refine_prompt: User's modification instructions
            selected_image_paths: Absolute filesystem paths to sketches to modify
            style_id: ID of the style
            session_id: Optional session ID for conversation context

        Returns:
            Tuple of (GenerationResult, Style)
        """
        self._initialize()

        # Step 1: Get style
        style = self.style_registry.get_style(style_id)

        # Step 2: Get original context from the initial generation turn
        original_context = ""
        refine_history = []
        if session_id:
            context = self.session_store.get_or_create(session_id, style_id)
            # Find the last role="generate" turn's refined_intent
            for turn in reversed(context.turns):
                if turn.role == "generate" and turn.refined_intent:
                    original_context = turn.refined_intent
                    break
            # Collect refine prompts only from the current generation cycle
            # (i.e., after the last "generate" turn)
            refine_history = []
            for turn in reversed(context.turns):
                if turn.role == "refine":
                    refine_history.insert(0, turn.user_input)
                elif turn.role == "generate":
                    break

        # Step 3: Refine images (1:1 mapping — each source → 1 output)
        config = GenerationConfig(
            num_images=len(selected_image_paths),
            resolution=(1024, 1024),
            output_dir="generated_outputs"
        )

        result = self.generator.refine(
            refine_prompt=refine_prompt,
            original_context=original_context,
            refine_history=refine_history,
            source_image_paths=selected_image_paths,
            style=style,
            config=config,
        )

        # Step 4: Record refine turn in session
        if session_id:
            context = self.session_store.get_or_create(session_id, style_id)
            turn = ConversationTurn(
                turn_number=context.turn_count + 1,
                role="refine",
                timestamp=result.timestamp,
                user_input=refine_prompt,
                style_id=style_id,
                refined_intent=original_context,
                image_paths=result.images,
            )
            context.add_turn(turn)
            self.conversation_logger.log_turn(session_id, style_id, turn.to_dict())

        return result, style

    async def refine_streaming(
        self,
        refine_prompt: str,
        selected_image_paths: List[str],
        style_id: str,
        session_id: Optional[str] = None,
    ) -> AsyncGenerator[dict, None]:
        """
        Streaming version of refine(). Yields SSE event dicts as each image completes.
        """
        self._initialize()

        style = self.style_registry.get_style(style_id)

        original_context = ""
        refine_history = []
        if session_id:
            context = self.session_store.get_or_create(session_id, style_id)
            for turn in reversed(context.turns):
                if turn.role == "generate" and turn.refined_intent:
                    original_context = turn.refined_intent
                    break
            refine_history = []
            for turn in reversed(context.turns):
                if turn.role == "refine":
                    refine_history.insert(0, turn.user_input)
                elif turn.role == "generate":
                    break

        config = GenerationConfig(
            num_images=len(selected_image_paths),
            resolution=(1024, 1024),
            output_dir="generated_outputs"
        )

        num_images = len(selected_image_paths)
        image_paths: List[Optional[str]] = [None] * num_images
        image_errors: List[Optional[str]] = [None] * num_images

        retry_events = []

        def on_retry(index, attempt, max_retries):
            retry_events.append({"index": index, "attempt": attempt, "maxRetries": max_retries})

        async for idx, image_path, error in self.generator.refine_streaming_async(
            refine_prompt=refine_prompt,
            original_context=original_context,
            refine_history=refine_history,
            source_image_paths=selected_image_paths,
            style=style,
            config=config,
            on_retry=on_retry
        ):
            # Drain retry events
            for info in retry_events:
                yield {
                    "event": "progress",
                    "data": {"stage": "retry", **info}
                }
            retry_events.clear()

            image_paths[idx] = image_path
            image_errors[idx] = error

            if image_path is not None:
                rel_path = Path(image_path).relative_to(Path("generated_outputs").resolve())
                sketch_data = {
                    "id": f"refine_{idx}",
                    "resolution": list(config.resolution),
                    "imagePath": f"/generated/{rel_path}",
                    "metadata": {
                        "promptSpec": {
                            "intent": refine_prompt,
                            "refinedIntent": original_context,
                            "negativeConstraints": []
                        },
                        "referenceImages": selected_image_paths,
                        "retrievalScores": []
                    }
                }
                yield {
                    "event": "image",
                    "data": {"index": idx, "sketch": sketch_data}
                }
            else:
                yield {
                    "event": "image",
                    "data": {"index": idx, "sketch": None, "error": error}
                }

        # Save metadata
        from generate.utils import save_metadata, get_timestamp
        timestamp = get_timestamp()
        successful_paths = [p for p in image_paths if p is not None]
        if successful_paths:
            output_dir = os.path.dirname(successful_paths[0])
            metadata_dict = {
                "timestamp": timestamp,
                "archived": False,
                "mode": "refine",
                "refine_prompt": refine_prompt,
                "original_context": original_context,
                "refine_history": refine_history,
                "source_images": selected_image_paths,
                "style": {"id": style.id, "name": style.name},
                "config": {
                    "num_images": config.num_images,
                    "resolution": list(config.resolution),
                    "model_name": config.model_name,
                    "aspect_ratio": config.aspect_ratio,
                },
                "images": [os.path.basename(p) for p in successful_paths],
                "image_errors": [e for e in image_errors if e is not None],
            }
            save_metadata(metadata_dict, output_dir)

        # Record turn
        if session_id:
            context = self.session_store.get_or_create(session_id, style_id)
            turn = ConversationTurn(
                turn_number=context.turn_count + 1,
                role="refine",
                timestamp=timestamp,
                user_input=refine_prompt,
                style_id=style_id,
                refined_intent=original_context,
                image_paths=image_paths,
            )
            context.add_turn(turn)
            self.conversation_logger.log_turn(session_id, style_id, turn.to_dict())

        yield {
            "event": "complete",
            "data": {
                "timestamp": timestamp,
                "totalImages": num_images,
                "successCount": len(successful_paths),
                "styleId": style.id
            }
        }

    def add_feedback(
        self,
        session_id: str,
        style_id: str,
        feedback: str,
    ) -> Tuple[int, bool]:
        """
        Record feedback in session context.

        Returns:
            Tuple of (turn_number, was_summarized) — summarized is True if
            the 10-feedback threshold triggered auto-summarization.
        """
        self._initialize()
        context = self.session_store.get_or_create(session_id, style_id)
        turn = ConversationTurn(
            turn_number=context.turn_count + 1,
            role="feedback",
            timestamp=datetime.utcnow().isoformat(),
            user_input=feedback,
            style_id=style_id,
        )
        context.add_turn(turn)
        self.conversation_logger.log_turn(session_id, style_id, turn.to_dict())

        # Auto-summarize at 10 feedbacks
        was_summarized = False
        if context.feedback_count >= 10: # --------------- USE 3 FOR TEST
            self.summarize_feedback(session_id, style_id)
            was_summarized = True

        return turn.turn_number, was_summarized

    def summarize_feedback(
        self,
        session_id: str,
        style_id: str
    ) -> Optional[str]:
        """
        Summarize accumulated feedback with GPT and persist to style.json.

        Returns:
            The summary string, or None if no feedback to summarize.
        """
        self._initialize()
        context = self.session_store.get_or_create(session_id, style_id)
        feedback_texts = context.get_feedback_texts()

        if not feedback_texts:
            return None

        # Get existing summary and style info
        style = self.style_registry.get_style(style_id)
        existing_summary = style.feedback_summary or ""

        # Build summarization prompt
        feedback_list = "\n".join(
            f"{i+1}. {text}" for i, text in enumerate(feedback_texts)
        )
        summarize_prompt = (
            f"You are summarizing designer feedback about generated concept sketches "
            f"in the '{style.name}' style.\n\n"
        )
        if existing_summary:
            summarize_prompt += f"Previous summary:\n{existing_summary}\n\n"
        summarize_prompt += (
            f"New feedback entries:\n{feedback_list}\n\n"
            f"Produce a concise summary of design directives that should guide future "
            f"image generation for this style. Incorporate the previous summary if present. "
            f"Focus on recurring stylistic preferences, specific corrections, and what to avoid. "
            f"Keep the summary under 200 words. Output only the summary text, no JSON."
        )

        # Call GPT for summarization
        response = self.compiler.client.chat.completions.create(
            model=self.compiler.model,
            messages=[
                {"role": "system", "content": "You are a design feedback summarizer."},
                {"role": "user", "content": summarize_prompt}
            ],
            temperature=0.3
        )
        summary = response.choices[0].message.content.strip()

        # Persist to style.json
        update_style_json(style_id, {"feedback_summary": summary})

        # Clear registry cache so next load picks up the new summary
        self.style_registry._cache.pop(style_id, None)

        # Reset session (feedback has been summarized)
        self.session_store.reset(session_id, style_id)

        return summary
