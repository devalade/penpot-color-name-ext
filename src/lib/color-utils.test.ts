import { describe, it, expect } from 'vitest';
import {
  hexToRgb,
  rgbToHsl,
  calculateLuminance,
  getContrastText,
  findClosestColor,
  findContrastVariations,
  findSimilarColors,
  getVariationsByLuminance,
  processVariations
} from './color-utils';

describe('hexToRgb', () => {
  it('should convert hex to RGB correctly', () => {
    expect(hexToRgb('#ff0000')).toEqual([255, 0, 0]);
    expect(hexToRgb('#00ff00')).toEqual([0, 255, 0]);
    expect(hexToRgb('#0000ff')).toEqual([0, 0, 255]);
  });

  it('should handle hex without #', () => {
    expect(hexToRgb('ff0000')).toEqual([255, 0, 0]);
  });

  it('should return [0,0,0] for invalid hex', () => {
    expect(hexToRgb('invalid')).toEqual([0, 0, 0]);
  });
});

describe('rgbToHsl', () => {
  it('should convert RGB to HSL correctly', () => {
    expect(rgbToHsl(255, 0, 0)).toEqual([0, 100, 50]);
    expect(rgbToHsl(0, 255, 0)).toEqual([120, 100, 50]);
    expect(rgbToHsl(0, 0, 255)).toEqual([240, 100, 50]);
  });
});

describe('calculateLuminance', () => {
  it('should calculate luminance correctly', () => {
    expect(calculateLuminance(255, 255, 255)).toBeCloseTo(1);
    expect(calculateLuminance(0, 0, 0)).toBeCloseTo(0);
  });
});

describe('getContrastText', () => {
  it('should return black for light backgrounds', () => {
    expect(getContrastText(0.6)).toBe('#000000');
  });

  it('should return white for dark backgrounds', () => {
    expect(getContrastText(0.4)).toBe('#FFFFFF');
  });
});

describe('findClosestColor', () => {
  const colornames = [
    { name: 'Red', hex: '#FF0000' },
    { name: 'Green', hex: '#00FF00' },
    { name: 'Blue', hex: '#0000FF' }
  ];
  const colorMap = new Map(colornames.map(color => [color.hex.toLowerCase(), color.name]));

  it('should find exact match', () => {
    expect(findClosestColor('#FF0000', colorMap, colornames)).toBe('Red');
  });

  it('should find closest color when no exact match', () => {
    expect(findClosestColor('#FF1010', colorMap, colornames)).toBe('Red');
  });
});

describe('findSimilarColors', () => {
  const colornames = [
    { name: 'Red', hex: '#FF0000' },
    { name: 'DarkRed', hex: '#8B0000' },
    { name: 'LightRed', hex: '#FF6666' },
    { name: 'Blue', hex: '#0000FF' },
    { name: 'Green', hex: '#00FF00' }
  ];

  it('should find similar colors based on hue and saturation', () => {
    const similarColors = findSimilarColors('#FF0000', colornames);

    // Should include red variations but not blue or green
    expect(similarColors.map(c => c.color)).toEqual(
      expect.arrayContaining(['#FF0000', '#8B0000', '#FF6666'])
    );
    expect(similarColors.map(c => c.color)).not.toEqual(
      expect.arrayContaining(['#0000FF', '#00FF00'])
    );
  });

  it('should return colors with scores less than 30', () => {
    const similarColors = findSimilarColors('#FF0000', colornames);
    similarColors.forEach(color => {
      expect(color.score).toBeLessThan(30);
    });
  });
});

describe('getVariationsByLuminance', () => {
  const similarColors = [
    { color: '#000000', score: 10, luminance: 0, lumDiff: 50 },
    { color: '#333333', score: 10, luminance: 20, lumDiff: 30 },
    { color: '#CCCCCC', score: 10, luminance: 80, lumDiff: -30 },
    { color: '#FFFFFF', score: 10, luminance: 100, lumDiff: -50 }
  ];

  it('should return darker variations correctly', () => {
    const darker = getVariationsByLuminance(similarColors, 'darker');
    expect(darker).toHaveLength(2);
    expect(darker[0].lumDiff).toBeGreaterThan(darker[1].lumDiff);
    expect(darker.every(c => c.lumDiff > 0)).toBe(true);
  });

  it('should return lighter variations correctly', () => {
    const lighter = getVariationsByLuminance(similarColors, 'lighter');
    expect(lighter).toHaveLength(2);
    expect(lighter[0].lumDiff).toBeLessThan(lighter[1].lumDiff);
    expect(lighter.every(c => c.lumDiff < 0)).toBe(true);
  });
});

describe('processVariations', () => {
  const colornames = [
    { name: 'Red', hex: '#FF0000' },
    { name: 'DarkRed', hex: '#8B0000' }
  ];
  const colorMap = new Map(colornames.map(color => [color.hex.toLowerCase(), color.name]));
  const variations = [
    { color: '#FF0000', score: 10, luminance: 50, lumDiff: 0 }
  ];

  it('should process darker variations correctly', () => {
    const processed = processVariations(variations, 'darker', colorMap, colornames);
    expect(processed[0]).toMatchObject({
      color: '#FF0000',
      type: 'darker',
      name: 'Red'
    });
  });

  it('should process lighter variations correctly', () => {
    const processed = processVariations(variations, 'lighter', colorMap, colornames);
    expect(processed[0]).toMatchObject({
      color: '#FF0000',
      type: 'lighter',
      name: 'Red'
    });
  });
});

describe('findContrastVariations', () => {
  const colornames = [
    { name: 'Red', hex: '#FF0000' },
    { name: 'DarkRed', hex: '#8B0000' },
    { name: 'LightRed', hex: '#FF6666' },
    { name: 'Blue', hex: '#0000FF' }
  ];
  const colorMap = new Map(colornames.map(color => [color.hex.toLowerCase(), color.name]));

  it('should return an array with darker, selected, and lighter variations', () => {
    const variations = findContrastVariations('#FF0000', colorMap, colornames);

    expect(variations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'darker' }),
        expect.objectContaining({ type: 'selected', isSelected: true }),
        expect.objectContaining({ type: 'lighter' })
      ])
    );
  });

  it('should maintain correct order of variations', () => {
    const variations = findContrastVariations('#FF0000', colorMap, colornames);

    const types = variations.map(v => v.type);
    expect(types).toEqual(
      expect.arrayContaining(['darker', 'selected', 'lighter'])
    );

    // Selected color should be in the middle
    const selectedIndex = variations.findIndex(v => v.type === 'selected');
    expect(selectedIndex).toBeGreaterThan(0);
    expect(selectedIndex).toBeLessThan(variations.length - 1);
  });
});
