# prompt/compiler.py
import json
from typing import Optional
from pathlib import Path
from openai import OpenAI
from .schema import PromptSpec

class PromptCompiler:
    """
    GPT-powered prompt compilation layer that transforms raw designer natural language
    and selected style context into structured prompt specifications.
    """

    def __init__(self, system_prompt: Optional[str] = None, api_key: Optional[str] = None, model: str = "gpt-4"):
        """
        Initialize the prompt compiler with system instructions.

        Args:
            system_prompt: Instructions for the LLM on how to compile prompts.
                          If not provided, loads from prompt/system_prompt.txt
            api_key: OpenAI API key (optional, will use environment variable if not provided)
            model: GPT model to use for compilation
        """
        if system_prompt is None:
            system_prompt = self._load_system_prompt()

        self.system_prompt = system_prompt
        self.model = model
        self.client = OpenAI(api_key=api_key) if api_key else OpenAI()

    @staticmethod
    def _load_system_prompt() -> str:
        """Load the system prompt from the default file."""
        prompt_file = Path(__file__).parent / "system_prompt.txt"
        with open(prompt_file, 'r') as f:
            return f.read()

    def compile(self, user_text: str, style) -> PromptSpec:
        """
        Compile natural language input into a structured PromptSpec.

        Args:
            user_text: Raw designer input (free-form natural language)
            style: Selected style object with id and visual_rules

        Returns:
            PromptSpec: Structured, model-agnostic prompt specification
        """
        # Prepare context for the LLM
        style_context = {
            "style_id": style.id,
            "visual_rules": style.visual_rules
        }

        # Build the compilation request
        user_prompt = self._build_compilation_request(user_text, style_context)

        # Call GPT to interpret and structure the prompt
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": self.system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,  # Some creativity but mostly consistent
            response_format={"type": "json_object"}
        )

        # Parse the structured response
        result = json.loads(response.choices[0].message.content)

        # Build and return the PromptSpec
        return PromptSpec(
            intent=user_text,
            refined_intent=result.get("refined_intent", user_text),
            style_id=style.id,
            visual_constraints=style.visual_rules,
            negative_constraints=result.get("negative_constraints", []),
            placement=result.get("placement"),
            subject_matter=result.get("subject_matter"),
            mood=result.get("mood"),
            technique=result.get("technique"),
            fidelity=result.get("fidelity"),
            composition_notes=result.get("composition_notes"),
            color_guidance=result.get("color_guidance")
        )

    def _build_compilation_request(self, user_text: str, style_context: dict) -> str:
        """
        Build the prompt for the LLM to compile the user's natural language.

        Args:
            user_text: Raw designer input
            style_context: Style information to apply

        Returns:
            Formatted prompt for the LLM
        """
        return f"""Designer Input: "{user_text}"
Style Context: {json.dumps(style_context, indent=2)}

[TODO: Add compilation instructions]
"""