// POST /api/generate - Generate concept sketches

import { Router } from 'express';
import { MockGenerationService } from '../services/mock-service.js';
import type { GenerateRequest } from '../../../shared/schema/api-contracts.js';

const router = Router();
const mockService = new MockGenerationService();

router.post('/generate', async (req, res) => {
  try {
    const { input, styleId, numImages, experimentalMode } = req.body as GenerateRequest;

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

    // Generate sketches (mock for MVP)
    const result = await mockService.generate({
      input,
      styleId,
      numImages: numImages || 4,
      experimentalMode: experimentalMode || false
    });

    res.json(result);
  } catch (error) {
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

export default router;
