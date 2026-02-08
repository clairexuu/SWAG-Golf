// POST /api/feedback - Submit feedback
// POST /api/feedback/summarize - Trigger feedback summarization

import { Router } from 'express';
import { fetchFromPython, checkPythonHealth } from '../services/python-client.js';
import type { FeedbackRequest, FeedbackResponse, SummarizeRequest, SummarizeResponse } from '../../../shared/schema/api-contracts.js';

const router = Router();

router.post('/feedback', async (req, res) => {
  try {
    const { sessionId, styleId, feedback } = req.body as FeedbackRequest;

    if (!sessionId || !styleId || !feedback) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Missing required fields: sessionId, styleId, and feedback are required'
        }
      });
    }

    const pythonHealthy = await checkPythonHealth();
    if (!pythonHealthy) {
      return res.status(503).json({
        success: false,
        error: {
          code: 'BACKEND_UNAVAILABLE',
          message: 'Python backend is unavailable'
        }
      });
    }

    const response = await fetchFromPython<FeedbackResponse>('/feedback', {
      method: 'POST',
      body: JSON.stringify({ sessionId, styleId, feedback })
    });

    return res.json(response);
  } catch (error) {
    console.error('Feedback error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FEEDBACK_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

router.post('/feedback/summarize', async (req, res) => {
  try {
    const { sessionId, styleId } = req.body as SummarizeRequest;

    if (!sessionId || !styleId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Missing required fields: sessionId and styleId are required'
        }
      });
    }

    const pythonHealthy = await checkPythonHealth();
    if (!pythonHealthy) {
      return res.status(503).json({
        success: false,
        error: {
          code: 'BACKEND_UNAVAILABLE',
          message: 'Python backend is unavailable'
        }
      });
    }

    const response = await fetchFromPython<SummarizeResponse>('/feedback/summarize', {
      method: 'POST',
      body: JSON.stringify({ sessionId, styleId })
    });

    return res.json(response);
  } catch (error) {
    console.error('Summarize error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SUMMARIZE_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

export default router;
