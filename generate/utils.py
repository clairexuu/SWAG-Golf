# generate/utils.py
import json
from pathlib import Path
from typing import Tuple
from datetime import datetime
from PIL import Image


def create_output_directory(base_dir: str, timestamp: str) -> str:
    """
    Create timestamped output directory for generated images.

    Args:
        base_dir: Base directory for outputs (e.g., "generated_outputs")
        timestamp: Timestamp string for the directory name

    Returns:
        Absolute path to created directory
    """
    output_path = Path(base_dir) / timestamp
    output_path.mkdir(parents=True, exist_ok=True)
    return str(output_path.absolute())


def get_timestamp() -> str:
    """
    Generate timestamp string for output directory.

    Returns:
        Timestamp in format: YYYYMMDD_HHMMSS
    """
    return datetime.now().strftime("%Y%m%d_%H%M%S")


def save_metadata(metadata_dict: dict, output_dir: str) -> str:
    """
    Save generation metadata as JSON file.

    Args:
        metadata_dict: Dictionary containing generation metadata
        output_dir: Directory to save metadata.json

    Returns:
        Path to saved metadata file
    """
    metadata_path = Path(output_dir) / "metadata.json"
    with open(metadata_path, 'w') as f:
        json.dump(metadata_dict, f, indent=2)
    return str(metadata_path.absolute())


def create_blank_sketch(resolution: Tuple[int, int], output_path: str) -> str:
    """
    Create blank grayscale image for placeholder/demo purposes.

    Args:
        resolution: (width, height) tuple
        output_path: Path to save the image

    Returns:
        Absolute path to created image
    """
    width, height = resolution

    # Create grayscale image with light gray background
    # RGB(240, 240, 240) is a light gray suitable for sketch placeholder
    img = Image.new('RGB', (width, height), color=(240, 240, 240))

    # Save as PNG
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(output_path, 'PNG')

    return str(output_path.absolute())
