// TypeScript interfaces mirroring generate/types.py

import { PromptSpec } from './prompt-spec';

export interface GenerationConfig {
  numImages: number;
  resolution: [number, number];
  outputDir: string;
  modelName: string;
  seed?: number;
}

export interface GenerationResult {
  images: string[];
  metadataPath: string;
  timestamp: string;
  promptSpec: PromptSpec;
  referenceImages: string[];
  config: GenerationConfig;
}
