# prompt/compiler.py
import json
import os
from typing import Optional
from pathlib import Path
from openai import OpenAI
from .schema import PromptSpec

# Configuration
TEMPERATURE = 0.7  # GPT temperature: some creativity but mostly consistent

class PromptCompiler:
    """
    GPT-powered prompt compilation layer that transforms raw designer natural language
    and selected style context into structured prompt specifications.
    """

    def __init__(self, system_prompt: Optional[str] = None, api_key: Optional[str] = None, model: Optional[str] = None):
        """
        Initialize the prompt compiler with system instructions.

        Args:
            system_prompt: Instructions for the LLM on how to compile prompts loaded from prompt/system_prompt.txt
            api_key: OpenAI API key, use environment variable if not provided
            model: GPT model to use for compilation (uses GPT_MODEL env var if not provided)
        """
        if system_prompt is None:
            system_prompt = self._load_system_prompt()

        # Resolve model from environment or use default
        if model is None:
            model = os.getenv('GPT_MODEL', 'gpt-4')

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
            style: Selected style object with id

        Returns:
            PromptSpec: Structured, model-agnostic prompt specification
        """
        # Prepare context for the LLM
        style_context = {
            "style_name": style.name,
            "style_description": style.description,
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
            temperature=TEMPERATURE,
            response_format={"type": "json_object"}
        )

        # Parse the structured response
        result = json.loads(response.choices[0].message.content)

        # Build and return the PromptSpec
        return PromptSpec(
            intent=user_text,
            refined_intent=result.get("refined_intent", user_text),
            negative_constraints=result.get("negative_constraints", []),
            placement=result.get("placement"),
            subject_matter=result.get("subject_matter"),
            mood=result.get("mood"),
            perspective=result.get("perspective"),
            composition_notes=result.get("composition_notes")
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

Style Context:
{json.dumps(style_context, indent=2)}

Analyze this designer input and compile it into a structured prompt specification. Apply the style rules as context for interpreting the input.

Output your response as a JSON object following the schema defined in the system instructions."""