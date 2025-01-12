<script lang="ts">
  import { onMount } from "svelte";
  import type { ColorShape } from "./types";
  let colornames: {
    name: string;
    hex: string;
  }[] = [];

  onMount(async () => {
    // @ts-ignore
    const module = (await import("color-name-list")) as any;
    colornames = module.colornames;
  });

  const colorMap = new Map(
    colornames.map((color) => [color.hex.toLowerCase(), color.name]),
  );

  interface ColorInfo {
    name: string;
    color: string;
    rgb?: string;
    hsl?: string;
    luminance?: number;
    contrastText?: string;
    isSelected: boolean;
  }

  function hexToRgb(hex: string): [number, number, number] {
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

  function findContrastVariations(targetHex: string): ColorInfo[] {
    const targetRgb = hexToRgb(targetHex);
    const targetHsl = rgbToHsl(...targetRgb);

    // Calculate similar colors with different luminance
    const colorVariations = colornames.map((color) => {
      const currentRgb = hexToRgb(color.hex);
      const currentHsl = rgbToHsl(...currentRgb);

      // Calculate how similar the colors are in hue and saturation
      const hueDiff = Math.abs(targetHsl[0] - currentHsl[0]);
      const satDiff = Math.abs(targetHsl[1] - currentHsl[1]);
      const lumDiff = targetHsl[2] - currentHsl[2];

      // Weight the differences (you can adjust these weights)
      const score = hueDiff * 1 + satDiff * 0.5;

      return {
        color: color.hex,
        score,
        luminance: currentHsl[2],
        lumDiff,
      };
    });

    // Filter colors with similar hue and saturation (lower score means more similar)
    const similarColors = colorVariations.filter((c) => c.score < 30);

    // Sort by luminance difference
    const darkerColors = similarColors
      .filter((c) => c.lumDiff > 0)
      .sort((a, b) => a.lumDiff - b.lumDiff)
      .slice(0, 2)
      .reverse();

    const lighterColors = similarColors
      .filter((c) => c.lumDiff < 0)
      .sort((a, b) => b.lumDiff - a.lumDiff)
      .slice(0, 2);

    const variations = [
      ...darkerColors.map((c) => ({
        ...processColor(c.color),
        type: "darker",
      })),
      { ...processColor(targetHex), type: "selected", isSelected: true },
      ...lighterColors.map((c) => ({
        ...processColor(c.color),
        type: "lighter",
      })),
    ];

    return variations;
  }

  function findClosestColor(targetHex: string): string {
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
          Math.pow(targetRgb[2] - currentRgb[2], 2),
      );

      if (distance < smallestDistance) {
        smallestDistance = distance;
        closestColor = color.name;
      }
    }

    return closestColor;
  }

  function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
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

  function calculateLuminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map((c) => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  function getContrastText(luminance: number): string {
    return luminance > 0.5 ? "#000000" : "#FFFFFF";
  }

  function processColor(color: string, isSelected: boolean = false): ColorInfo {
    const rgb = hexToRgb(color);
    const hsl = rgbToHsl(...rgb);
    const luminance = calculateLuminance(...rgb);
    const name = findClosestColor(color);

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

  let variants = $state<{
    value: Array<ColorInfo>;
  }>({
    value: [],
  });

  function onMessage(event: MessageEvent) {
    if (event.data.type === "selectionchange") {
      const data = JSON.parse(event.data.content) as ColorShape[];
      variants.value = data.flatMap((item) =>
        findContrastVariations(item.color),
      );
    }
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }
</script>

<svelte:window onmessage={onMessage} />

<main>
  {#if variants.value.length === 0}
    <div class="empty-state">Select something with solid fill</div>
  {/if}

  {#if variants.value.length > 0}
    <div class="color-container">
      <ul class="color-list">
        {#each variants.value as variant}
          <li>
            <div
              class="color-item {variant.isSelected ? 'selected' : ''}"
              style="--color: {variant.color}; --text-color: {variant.contrastText}"
            >
              <div class="color-info">
                <div class="color-meta">
                  {#if variant.isSelected}
                    <span class="contrast-indicator selected">Selected</span>
                  {/if}
                  <span class="color-name">{variant.name}</span>
                </div>
                <div class="color-values">
                  <button
                    class="copy-button"
                    onclick={() => copyToClipboard(variant.color)}
                    title="Click to copy HEX"
                  >
                    {variant.color}
                  </button>
                </div>
              </div>
            </div>
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</main>

<style>
  main {
    overflow: hidden;
    color: white;
    background-color: black;
    padding: 1rem;
    min-height: 100vh;
  }

  .empty-state {
    text-align: center;
    padding: 2rem;
    font-size: 1.1rem;
    opacity: 0.8;
  }

  .color-container {
    max-width: calc(100vh - 2rem);
    margin: 0 auto;
  }

  .color-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    border-radius: 4px;
  }

  .color-item {
    width: 100%;
    background-color: var(--color);
    color: var(--text-color);
    border-radius: 4px;
    overflow: hidden;
    transition: transform 0.2s ease;
  }

  .color-item:hover {
    transform: translateX(4px);
  }

  .color-info {
    padding: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }

  .color-name {
    font-weight: 500;
    font-size: 1.1rem;
  }

  .color-values {
    display: flex;
    gap: 1rem;
    font-family: monospace;
  }

  .color-meta {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .contrast-indicator {
    font-size: 0.75rem;
    padding: 2px 8px;
    border-radius: 4px;
    background-color: rgba(255, 255, 255, 0.2);
    width: fit-content;
  }

  .contrast-indicator.darker {
    background-color: rgba(0, 0, 0, 0.2);
  }

  .contrast-indicator.lighter {
    background-color: rgba(255, 255, 255, 0.3);
  }

  .contrast-indicator.selected {
    background-color: rgba(255, 255, 255, 0.3);
    font-weight: bold;
  }

  .selected {
    transform: scale(1.02);
    box-shadow: 0 0 0 2px var(--text-color);
  }

  .color-item.selected:hover {
    transform: translateX(4px) scale(1.02);
  }
  .selected-indicator {
    background-color: rgba(255, 255, 255, 0.2);
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.8em;
    margin-right: 8px;
  }

  .color-item.selected:hover {
    transform: translateX(4px) scale(1.02);
  }

  .copy-button {
    background: none;
    border: none;
    color: inherit;
    padding: 0.25rem 0.5rem;
    cursor: pointer;
    border-radius: 4px;
    font-size: 0.9rem;
    opacity: 0.8;
    transition: opacity 0.2s ease;
  }

  .copy-button:hover {
    opacity: 1;
    background-color: rgba(255, 255, 255, 0.1);
  }
</style>
