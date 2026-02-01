// TypeScript interface mirroring prompt/schema.py PromptSpec dataclass

export interface PromptSpec {
  intent: string;
  refinedIntent: string;
  negativeConstraints?: string[];
  enforcedConstraints?: string[];
}
