// REST API request/response type definitions

import { PromptSpec } from './prompt-spec';
import { GenerationConfig } from './generation';

export interface GenerateRequest {
  input: string;
  styleId: string;
  numImages?: number;
  experimentalMode?: boolean;
  sessionId?: string;
}

export interface Sketch {
  id: string;
  imagePath: string | null;
  resolution: [number, number];
  error?: string;
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

export interface FeedbackRequest {
  sessionId: string;
  styleId: string;
  feedback: string;
}

export interface FeedbackResponse {
  success: boolean;
  turnNumber?: number;
  summarized?: boolean;
  error?: {
    code: string;
    message: string;
  };
}

export interface SummarizeRequest {
  sessionId: string;
  styleId: string;
}

export interface SummarizeResponse {
  success: boolean;
  summary?: string;
  error?: {
    code: string;
    message: string;
  };
}

export interface RefineRequest {
  refinePrompt: string;
  selectedImagePaths: string[];
  styleId: string;
  sessionId?: string;
}
