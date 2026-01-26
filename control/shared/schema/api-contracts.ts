// REST API request/response type definitions

import { PromptSpec } from './prompt-spec';
import { GenerationConfig } from './generation';

export interface GenerateRequest {
  input: string;
  styleId: string;
  numImages?: number;
  experimentalMode?: boolean;
}

export interface Sketch {
  id: string;
  imagePath: string;
  resolution: [number, number];
  metadata: {
    promptSpec: PromptSpec;
    referenceImages: string[];
    retrievalScores: number[];
  };
}

export interface GenerateResponse {
  success: boolean;
  data?: {
    timestamp: string;
    sketches: Sketch[];
    generationMetadata: {
      styleId: string;
      configUsed: GenerationConfig;
    };
  };
  error?: {
    code: string;
    message: string;
  };
}
