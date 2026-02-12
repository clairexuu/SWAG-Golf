// GET /api/styles - Return available style options

import { Router } from 'express';
import { Readable } from 'stream';
import type { Style } from '../../../shared/schema/style.js';
import { fetchFromPython, checkPythonHealth } from '../services/python-client.js';

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://127.0.0.1:8000';

const router = Router();

// Fallback mock styles (used when Python backend is unavailable)
const mockStyles: Style[] = [
  {
    id: 'vintage-mascot',
    name: 'Vintage Mascot',
    description: 'Thick ink lines, retro character style with bold outlines',
    visualRules: {
      lineWeight: 'heavy',
      looseness: 'controlled',
      complexity: 'medium',
      additionalRules: {
        characterStyle: 'cartoonish',
        era: '1950s-1970s'
      }
    },
    referenceImages: [],
    doNotUse: []
  },
  {
    id: 'modern-minimal',
    name: 'Modern Minimal',
    description: 'Clean lines, geometric shapes, contemporary aesthetic',
    visualRules: {
      lineWeight: 'thin',
      looseness: 'precise',
      complexity: 'low',
      additionalRules: {
        style: 'geometric',
        emphasis: 'simplicity'
      }
    },
    referenceImages: [],
    doNotUse: []
  },
  {
    id: 'retro-badge',
    name: 'Retro Badge',
    description: 'Classic emblem style with ornate details',
    visualRules: {
      lineWeight: 'medium',
      looseness: 'structured',
      complexity: 'high',
      additionalRules: {
        format: 'badge/emblem',
        ornamentation: 'detailed'
      }
    },
    referenceImages: [],
    doNotUse: []
  },
  {
    id: 'playful-cartoon',
    name: 'Playful Cartoon',
    description: 'Fun, bouncy characters with exaggerated features',
    visualRules: {
      lineWeight: 'varied',
      looseness: 'loose',
      complexity: 'medium',
      additionalRules: {
        characterStyle: 'exaggerated',
        mood: 'playful'
      }
    },
    referenceImages: [],
    doNotUse: []
  },
  {
    id: 'technical-diagram',
    name: 'Technical Diagram',
    description: 'Precise, blueprint-style technical illustration',
    visualRules: {
      lineWeight: 'uniform',
      looseness: 'precise',
      complexity: 'high',
      additionalRules: {
        style: 'technical',
        annotations: 'detailed'
      }
    },
    referenceImages: [],
    doNotUse: []
  }
];

router.get('/styles', async (req, res) => {
  try {
    // Try Python backend first
    const pythonHealthy = await checkPythonHealth();

    if (pythonHealthy) {
      const response = await fetchFromPython<{ success: boolean; styles: Style[] }>('/styles');
      return res.json(response);
    }

    // Fallback to mock styles if Python unavailable
    console.log('Python backend unavailable, using mock styles');
    res.json({
      success: true,
      styles: mockStyles
    });
  } catch (error) {
    console.error('Error fetching styles:', error);
    // Fallback to mock styles on error
    res.json({
      success: true,
      styles: mockStyles
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
