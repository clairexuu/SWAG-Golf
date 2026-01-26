// TypeScript interfaces mirroring style/types.py

export interface VisualRules {
  lineWeight: string;
  looseness: string;
  complexity: string;
  additionalRules: Record<string, any>;
}

export interface Style {
  id: string;
  name: string;
  description: string;
  visualRules: VisualRules;
  referenceImages: string[];
  doNotUse?: string[];
}
