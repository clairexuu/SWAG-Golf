// GET /api/styles - Return available style options

import { Router } from 'express';
import type { Style } from '../../../shared/schema/style.js';

const router = Router();

// Mock styles for MVP
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

router.get('/styles', (req, res) => {
  res.json({
    success: true,
    styles: mockStyles
  });
});

export default router;
