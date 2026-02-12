/** TypeScript interfaces for generation history. */

export interface GenerationSummary {
  timestamp: string;
  dirName: string;
  userPrompt: string;
  style: { id: string; name: string };
  imageCount: number;
  images: string[];
}

export interface GenerationsResponse {
  success: boolean;
  total: number;
  generations: GenerationSummary[];
}

/** Frontend-side grouped structure for the archive page. */
export interface StyleGroup {
  styleId: string;
  styleName: string;
  generations: GenerationSummary[];
  totalImages: number;
}
