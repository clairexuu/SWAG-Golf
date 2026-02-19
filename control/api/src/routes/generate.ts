// POST /api/generate - Generate concept sketches

import { Router } from 'express';
import { fetchFromPython, checkPythonHealth } from '../services/python-client.js';
import type { GenerateRequest, GenerateResponse, RefineRequest } from '../../../shared/schema/api-contracts.js';

const router = Router();
const MAX_RETRIES = 2;
const RETRY_DELAYS = [1000, 2000]; // ms

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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

    // Retry loop: try up to 3 times with backoff
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (abortController.signal.aborted) return;

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
          console.error(`[Generate] Attempt ${attempt + 1} failed:`, pythonError);
        }
      } else {
        console.warn(`[Generate] Health check failed (attempt ${attempt + 1}/${MAX_RETRIES + 1})`);
      }

      // Wait before retrying (skip delay after last attempt)
      if (attempt < MAX_RETRIES) {
        console.log(`[Generate] Retrying in ${RETRY_DELAYS[attempt]}ms...`);
        await delay(RETRY_DELAYS[attempt]);
      }
    }

    // All retries exhausted
    return res.status(503).json({
      success: false,
      error: {
        code: 'BACKEND_UNAVAILABLE',
        message: 'Generation service temporarily unavailable. Please try again or restart the service.'
      }
    });
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

    // Retry loop: try up to 3 times with backoff
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (abortController.signal.aborted) return;

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
          console.error(`[Refine] Attempt ${attempt + 1} failed:`, pythonError);
        }
      } else {
        console.warn(`[Refine] Health check failed (attempt ${attempt + 1}/${MAX_RETRIES + 1})`);
      }

      if (attempt < MAX_RETRIES) {
        console.log(`[Refine] Retrying in ${RETRY_DELAYS[attempt]}ms...`);
        await delay(RETRY_DELAYS[attempt]);
      }
    }

    // All retries exhausted
    return res.status(503).json({
      success: false,
      error: {
        code: 'BACKEND_UNAVAILABLE',
        message: 'Generation service temporarily unavailable. Please try again or restart the service.'
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
