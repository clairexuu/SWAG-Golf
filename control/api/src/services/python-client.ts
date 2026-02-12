// HTTP client for communicating with Python FastAPI backend

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://127.0.0.1:8000';

/**
 * Fetch data from Python backend.
 * @param endpoint - API endpoint (e.g., '/styles', '/generate')
 * @param options - Fetch options
 * @returns Parsed JSON response
 */
export async function fetchFromPython<T>(
  endpoint: string,
  options: RequestInit = {},
  signal?: AbortSignal
): Promise<T> {
  const url = `${PYTHON_API_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    signal,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Python API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

/**
 * Check if Python backend is healthy and reachable.
 * @returns true if Python backend is available
 */
export async function checkPythonHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${PYTHON_API_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(2000), // 2 second timeout
    });
    return response.ok;
  } catch {
    return false;
  }
}
