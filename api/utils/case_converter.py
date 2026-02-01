"""Utilities for converting between snake_case and camelCase."""

import re
from typing import Any, Dict, List, Union


def snake_to_camel(snake_str: str) -> str:
    """Convert snake_case string to camelCase."""
    components = snake_str.split('_')
    return components[0] + ''.join(x.title() for x in components[1:])


def camel_to_snake(camel_str: str) -> str:
    """Convert camelCase string to snake_case."""
    return re.sub(r'(?<!^)(?=[A-Z])', '_', camel_str).lower()


def convert_keys_to_camel(data: Union[Dict, List, Any]) -> Union[Dict, List, Any]:
    """Recursively convert all dictionary keys from snake_case to camelCase."""
    if isinstance(data, dict):
        return {snake_to_camel(k): convert_keys_to_camel(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [convert_keys_to_camel(item) for item in data]
    return data


def convert_keys_to_snake(data: Union[Dict, List, Any]) -> Union[Dict, List, Any]:
    """Recursively convert all dictionary keys from camelCase to snake_case."""
    if isinstance(data, dict):
        return {camel_to_snake(k): convert_keys_to_snake(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [convert_keys_to_snake(item) for item in data]
    return data
