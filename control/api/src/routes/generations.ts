// GET /api/generations - Return past generation history

import { Router } from 'express';
import { fetchFromPython, checkPythonHealth } from '../services/python-client.js';

const router = Router();

interface GenerationsResponse {
  success: boolean;
  total: number;
  generations: Array<{
    timestamp: string;
    dirName: string;
    userPrompt: string;
    style: { id: string; name: string };
    imageCount: number;
    images: string[];
  }>;
}

router.get('/generations', async (req, res) => {
  try {
    const pythonHealthy = await checkPythonHealth();

    if (pythonHealthy) {
      const queryString = new URLSearchParams(
        req.query as Record<string, string>
      ).toString();
      const endpoint = queryString ? `/generations?${queryString}` : '/generations';
      const response = await fetchFromPython<GenerationsResponse>(endpoint);
      return res.json(response);
    }

    // Fallback: empty list when Python is unavailable
    res.json({
      success: true,
      total: 0,
      generations: [],
    });
  } catch (error) {
    console.error('Error fetching generations:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GENERATIONS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch generations',
      },
    });
  }
});

export default router;
