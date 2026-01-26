// TypeScript interface mirroring prompt/schema.py PromptSpec dataclass

export interface PromptSpec {
  intent: string;
  refinedIntent: string;
  styleId: string;
  visualConstraints: Record<string, any>;
  negativeConstraints: string[];
  placement?: string;
  subjectMatter?: string;
  mood?: string;
  technique?: string;
  fidelity?: string;
  compositionNotes?: string;
  colorGuidance?: string;
}
