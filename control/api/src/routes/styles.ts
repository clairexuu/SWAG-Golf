// GET /api/styles - Return available style options

import { Router } from 'express';
import { Readable } from 'stream';
import type { Style } from '../../../shared/schema/style.js';
import { fetchFromPython, checkPythonHealth } from '../services/python-client.js';

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://127.0.0.1:8000';

const router = Router();
const MAX_RETRIES = 2;
const RETRY_DELAYS = [1000, 2000]; // ms

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

router.get('/styles', async (req, res) => {
  try {
    // Retry loop: try up to 3 times with backoff
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const pythonHealthy = await checkPythonHealth();
      if (pythonHealthy) {
        try {
          const response = await fetchFromPython<{ success: boolean; styles: Style[] }>('/styles');
          return res.json(response);
        } catch (err) {
          console.error(`[Styles] Attempt ${attempt + 1} failed:`, err);
        }
      } else {
        console.warn(`[Styles] Health check failed (attempt ${attempt + 1}/${MAX_RETRIES + 1})`);
      }

      if (attempt < MAX_RETRIES) {
        await delay(RETRY_DELAYS[attempt]);
      }
    }

    // All retries exhausted
    res.status(503).json({
      success: false,
      error: {
        code: 'BACKEND_UNAVAILABLE',
        message: 'Style service temporarily unavailable. Please try again or restart the service.'
      }
    });
  } catch (error) {
    console.error('Error fetching styles:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'STYLES_ERROR',
        message: error instanceof Error ? error.message : 'Failed to load styles'
      }
    });
  }
});

router.post('/styles', async (req, res) => {
  try {
    const pythonHealthy = await checkPythonHealth();
    if (!pythonHealthy) {
      return res.status(503).json({
        success: false,
        error: 'Python backend is unavailable'
      });
    }

    // Forward the raw multipart request stream to Python
    const response = await fetch(`${PYTHON_API_URL}/styles`, {
      method: 'POST',
      headers: {
        'content-type': req.headers['content-type'] as string,
      },
      body: Readable.toWeb(req) as ReadableStream,
      duplex: 'half',
    } as RequestInit);

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error: any) {
    console.error('Error creating style:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create style'
    });
  }
});

router.post('/styles/:styleId/images', async (req, res) => {
  const { styleId } = req.params;
  try {
    const pythonHealthy = await checkPythonHealth();
    if (!pythonHealthy) {
      return res.status(503).json({
        success: false,
        error: 'Python backend is unavailable'
      });
    }

    // Forward the raw multipart request stream to Python
    const response = await fetch(`${PYTHON_API_URL}/styles/${styleId}/images`, {
      method: 'POST',
      headers: {
        'content-type': req.headers['content-type'] as string,
      },
      body: Readable.toWeb(req) as ReadableStream,
      duplex: 'half',
    } as RequestInit);

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error: any) {
    console.error(`Error adding images to style ${styleId}:`, error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to add images'
    });
  }
});

router.put('/styles/:styleId', async (req, res) => {
  const { styleId } = req.params;
  try {
    const pythonHealthy = await checkPythonHealth();
    if (!pythonHealthy) {
      return res.status(503).json({
        success: false,
        error: 'Python backend is unavailable'
      });
    }

    const response = await fetchFromPython<{ success: boolean; style: any }>(
      `/styles/${styleId}`,
      {
        method: 'PUT',
        body: JSON.stringify(req.body),
      }
    );
    return res.json(response);
  } catch (error: any) {
    console.error(`Error updating style ${styleId}:`, error);
    const status = error.message?.includes('404') ? 404 : 500;
    res.status(status).json({
      success: false,
      error: error.message || 'Failed to update style'
    });
  }
});

router.delete('/styles/:styleId', async (req, res) => {
  const { styleId } = req.params;
  try {
    const pythonHealthy = await checkPythonHealth();
    if (!pythonHealthy) {
      return res.status(503).json({
        success: false,
        error: 'Python backend is unavailable'
      });
    }

    const response = await fetchFromPython<{ success: boolean; message: string }>(
      `/styles/${styleId}`,
      { method: 'DELETE' }
    );
    return res.json(response);
  } catch (error: any) {
    console.error(`Error deleting style ${styleId}:`, error);
    const status = error.message?.includes('404') ? 404 : 500;
    res.status(status).json({
      success: false,
      error: error.message || 'Failed to delete style'
    });
  }
});

router.delete('/styles/:styleId/images', async (req, res) => {
  const { styleId } = req.params;
  try {
    const pythonHealthy = await checkPythonHealth();
    if (!pythonHealthy) {
      return res.status(503).json({
        success: false,
        error: 'Python backend is unavailable'
      });
    }

    const response = await fetchFromPython<{ success: boolean; deleted: number; message: string }>(
      `/styles/${styleId}/images`,
      {
        method: 'DELETE',
        body: JSON.stringify(req.body),
      }
    );
    return res.json(response);
  } catch (error: any) {
    console.error(`Error deleting images from style ${styleId}:`, error);
    const status = error.message?.includes('404') ? 404 : 500;
    res.status(status).json({
      success: false,
      error: error.message || 'Failed to delete images'
    });
  }
});

export default router;
