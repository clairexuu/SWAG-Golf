// POST /api/generate - Generate concept sketches

import { Router } from 'express';
import { MockGenerationService } from '../services/mock-service.js';
import { fetchFromPython, checkPythonHealth } from '../services/python-client.js';
import type { GenerateRequest, GenerateResponse, RefineRequest } from '../../../shared/schema/api-contracts.js';

const router = Router();
const mockService = new MockGenerationService();

router.post('/generate', async (req, res) => {
  // Abort Python fetch if client disconnects (user cancelled)
  const abortController = new AbortController();
  res.on('close', () => {
    if (!res.writableEnded) {
      abortController.abort();
    }
  });

  try {
    const { input, styleId, numImages, experimentalMode, sessionId } = req.body as GenerateRequest;

    // Validate required fields
    if (!input || !styleId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Missing required fields: input and styleId are required'
        }
      });
    }

    // Validate input length
    if (input.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Input text cannot be empty'
        }
      });
    }

    // Try Python backend first
    const pythonHealthy = await checkPythonHealth();

    if (pythonHealthy) {
      try {
        const response = await fetchFromPython<GenerateResponse>('/generate', {
          method: 'POST',
          body: JSON.stringify({ input, styleId, numImages: numImages || 4, experimentalMode, sessionId })
        }, abortController.signal);
        return res.json(response);
      } catch (pythonError) {
        if ((pythonError as Error).name === 'AbortError') {
          console.log('Generation cancelled by client');
          return;
        }
        console.error('Python backend error, falling back to mock:', pythonError);
      }
    }

    // Fallback to mock service
    console.log('Using mock generation service');
    const result = await mockService.generate({
      input,
      styleId,
      numImages: numImages || 4,
      experimentalMode: experimentalMode || false
    });

    res.json(result);
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      console.log('Generation cancelled by client');
      return;
    }
    console.error('Generation error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GENERATION_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    });
  }
});

router.post('/refine', async (req, res) => {
  const abortController = new AbortController();
  res.on('close', () => {
    if (!res.writableEnded) {
      abortController.abort();
    }
  });

  try {
    const { refinePrompt, selectedImagePaths, styleId, sessionId } = req.body as RefineRequest;

    // Validate required fields
    if (!refinePrompt || !selectedImagePaths?.length || !styleId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Missing required fields: refinePrompt, selectedImagePaths, and styleId are required'
        }
      });
    }

    // Refine requires the real Python backend — no mock fallback
    const pythonHealthy = await checkPythonHealth();

    if (pythonHealthy) {
      try {
        const response = await fetchFromPython<GenerateResponse>('/refine', {
          method: 'POST',
          body: JSON.stringify({ refinePrompt, selectedImagePaths, styleId, sessionId })
        }, abortController.signal);
        return res.json(response);
      } catch (pythonError) {
        if ((pythonError as Error).name === 'AbortError') {
          console.log('Refine cancelled by client');
          return;
        }
        const message = pythonError instanceof Error ? pythonError.message : 'Unknown error';
        console.error('Python refine error:', message);
        return res.status(502).json({
          success: false,
          error: {
            code: 'REFINE_ERROR',
            message,
          }
        });
      }
    }

    res.status(503).json({
      success: false,
      error: {
        code: 'BACKEND_UNAVAILABLE',
        message: 'Python backend is required for refine but is not available'
      }
    });
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      console.log('Refine cancelled by client');
      return;
    }
    console.error('Refine error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'REFINE_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    });
  }
});

export default router;
