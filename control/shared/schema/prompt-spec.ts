// TypeScript interface mirroring prompt/schema.py PromptSpec dataclass

export interface PromptSpec {
  intent: string;
  refinedIntent: string;
  negativeConstraints?: string[];
  placement?: string;
  subjectMatter?: string;
  mood?: string;
  perspective?: string;
  compositionNotes?: string;
}
