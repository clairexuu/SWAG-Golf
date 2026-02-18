// Mock generation service for MVP (no Python backend integration yet)

import type { GenerateRequest, GenerateResponse, Sketch } from '../../../shared/schema/api-contracts.js';
import type { PromptSpec } from '../../../shared/schema/prompt-spec.js';
import type { GenerationConfig } from '../../../shared/schema/generation.js';

export class MockGenerationService {
  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    // Simulate 1.5 second processing time
    await new Promise(resolve => setTimeout(resolve, 1500));

    const numImages = request.numImages || 4;
    const timestamp = new Date().toISOString();

    // Create mock prompt spec
    const mockPromptSpec: PromptSpec = {
      intent: request.input,
      refinedIntent: `Mock refined: ${request.input}`,
      negativeConstraints: [],
      enforcedConstraints: [
        'Black & white or grayscale ONLY',
        'Rough sketch / pencil / loose ink style',
        'Thick outlines, minimal interior detail',
        'Clean background',
        'High contrast for visibility'
      ]
    };

    // Generate mock sketches
    const sketches: Sketch[] = Array.from({ length: numImages }, (_, i) => ({
      id: `${timestamp}_sketch_${i}`,
      imagePath: `/mock-outputs/placeholder-${i}.png`,
      resolution: [1024, 1024] as [number, number],
      metadata: {
        promptSpec: mockPromptSpec,
        referenceImages: [],
        retrievalScores: []
      }
    }));

    const mockConfig: GenerationConfig = {
      numImages,
      resolution: [1024, 1024] as [number, number],
      outputDir: 'generated_outputs',
      modelName: 'nano-banana',
      seed: undefined
    };

    return {
      success: true,
      data: {
        timestamp,
        sketches,
        generationMetadata: {
          styleId: request.styleId,
          configUsed: mockConfig
        }
      }
    };
  }
}
