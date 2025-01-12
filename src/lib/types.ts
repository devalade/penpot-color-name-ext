export interface ColorInfo {
  name: string;
  color: string;
  rgb: string;
  hsl: string;
  luminance: number;
  contrastText: string;
  isSelected?: boolean;
  type?: string;
}

export interface ColorVariation {
  color: string;
  score: number;
  luminance: number;
  lumDiff: number;
}


export type SimilarityParams = {
  targetHsl: [number, number, number];
  currentHsl: [number, number, number];
};
