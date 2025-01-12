import type { ColorInfo, ColorVariation, SimilarityParams } from './types';

export function hexToRgb(hex: string): [number, number, number] {
  const cleanHex = hex.toLowerCase();
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(cleanHex);
  return result
    ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16),
    ]
    : [0, 0, 0];
}

export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0,
    s = 0,
    l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

export function calculateLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function getContrastText(luminance: number): string {
  return luminance > 0.5 ? "#000000" : "#FFFFFF";
}

export function findClosestColor(targetHex: string, colorMap: Map<string, string>, colornames: Array<{ name: string, hex: string }>): string {
  // First try exact match
  const exactMatch = colorMap.get(targetHex.toLowerCase());
  if (exactMatch) return exactMatch;

  // If no exact match, find the closest color
  const targetRgb = hexToRgb(targetHex);
  let closestColor = "";
  let smallestDistance = Infinity;

  for (const color of colornames) {
    const currentRgb = hexToRgb(color.hex);
    const distance = Math.sqrt(
      Math.pow(targetRgb[0] - currentRgb[0], 2) +
      Math.pow(targetRgb[1] - currentRgb[1], 2) +
      Math.pow(targetRgb[2] - currentRgb[2], 2)
    );

    if (distance < smallestDistance) {
      smallestDistance = distance;
      closestColor = color.name;
    }
  }

  return closestColor;
}

export function processColor(
  color: string,
  colorMap: Map<string, string>,
  colornames: Array<{ name: string, hex: string }>,
  isSelected: boolean = false
): ColorInfo {
  const rgb = hexToRgb(color);
  const hsl = rgbToHsl(...rgb);
  const luminance = calculateLuminance(...rgb);
  const name = findClosestColor(color, colorMap, colornames);

  return {
    name,
    color,
    rgb: `rgb(${rgb.join(", ")})`,
    hsl: `hsl(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%)`,
    luminance,
    contrastText: getContrastText(luminance),
    isSelected,
  };
}

/**
 * Calculates a similarity score between two colors based on their HSL values
 * Lower scores indicate more similar colors
 */
export function calculateSimilarityScore({ targetHsl, currentHsl }: SimilarityParams): number {
  const hueDiff = Math.abs(targetHsl[0] - currentHsl[0]);
  const satDiff = Math.abs(targetHsl[1] - currentHsl[1]);
  return hueDiff * 1 + satDiff * 0.5;
}

/**
 * Finds colors that are similar to the target color based on hue and saturation
 */
export function findSimilarColors(
  targetHex: string,
  colornames: Array<{ name: string; hex: string }>
): ColorVariation[] {
  const targetRgb = hexToRgb(targetHex);
  const targetHsl = rgbToHsl(...targetRgb);

  return colornames
    .map((color) => {
      const currentRgb = hexToRgb(color.hex);
      const currentHsl = rgbToHsl(...currentRgb);

      const score = calculateSimilarityScore({
        targetHsl,
        currentHsl,
      });

      return {
        color: color.hex,
        score,
        luminance: currentHsl[2],
        lumDiff: targetHsl[2] - currentHsl[2],
      };
    })
    .filter((c) => c.score < 30);
}

export function getVariationsByLuminance(
  similarColors: ColorVariation[],
  type: 'darker' | 'lighter'
): ColorVariation[] {
  const count = 2;
  return similarColors
    .filter((c) => type === 'darker' ? c.lumDiff > 0 : c.lumDiff < 0)
    .sort((a, b) => type === 'darker'
      ? a.lumDiff - b.lumDiff
      : b.lumDiff - a.lumDiff
    )
    .slice(0, count)
    .reverse();
}

export function processVariations(
  variations: ColorVariation[],
  type: 'darker' | 'lighter',
  colorMap: Map<string, string>,
  colornames: Array<{ name: string; hex: string }>
): ColorInfo[] {
  return variations.map((c) => ({
    ...processColor(c.color, colorMap, colornames),
    type,
  }));
}

export function findContrastVariations(
  targetHex: string,
  colorMap: Map<string, string>,
  colornames: Array<{ name: string; hex: string }>
): ColorInfo[] {
  const similarColors = findSimilarColors(targetHex, colornames);

  const darkerColors = getVariationsByLuminance(similarColors, 'darker');
  const lighterColors = getVariationsByLuminance(similarColors, 'lighter');

  return [
    ...processVariations(darkerColors, 'darker', colorMap, colornames),
    {
      ...processColor(targetHex, colorMap, colornames),
      type: 'selected',
      isSelected: true,
    },
    ...processVariations(lighterColors, 'lighter', colorMap, colornames),
  ];
}
