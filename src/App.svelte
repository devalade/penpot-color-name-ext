<script lang="ts">
  import { onMount } from "svelte";
  import { findContrastVariations } from "./lib/color-utils";
  import type { ColorShape } from "./types";
  import type { ColorInfo } from "./lib/types";

  let colornames: { name: string; hex: string }[] = [];

  onMount(async () => {
    // @ts-ignore
    const module = (await import("color-name-list")) as any;
    colornames = module.colornames;
    if (colornames) {
      simulateColorChange();
    }
  });

  const colorMap = new Map(
    colornames.map((color) => [color.hex.toLowerCase(), color.name]),
  );

  let variants = $state<{
    value: Record<string, Array<ColorInfo>>;
  }>({
    value: {},
  });

  function onMessage(event: MessageEvent): void {
    if (event.data.type === "selectionchange") {
      const data = JSON.parse(event.data.content) as ColorShape[];
      variants.value = data.reduce(
        (acc, item) => ({
          ...acc,
          [item.color]: findContrastVariations(
            item.color,
            colorMap,
            colornames,
          ),
        }),
        {},
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

{#snippet colorBlock(variants: Array<ColorInfo>)}
  <div class="color-container">
    <ul class="color-list">
      {#each variants as variant (variant.color)}
        <li>
          <div
            class="color-item"
            style="--color: {variant.color}; --text-color: {variant.contrastText}"
          >
            <div class="color-info">
              <span class="color-name">{variant.name}</span>
              {#if variant.isSelected}
                <span class="contrast-indicator selected">Selected</span>
              {:else}
                <button
                  class="copy-button"
                  onclick={() => copyToClipboard(variant.color)}
                  title="Click to copy HEX"
                >
                  {variant.color}
                </button>
              {/if}
            </div>
          </div>
        </li>
      {/each}
    </ul>
  </div>
{/snippet}

<main>
  {#if Object.keys(variants.value).length === 0}
    <div class="empty-state">Select something with solid fill</div>
  {/if}

  {#if Object.keys(variants.value).length > 0}
    {#each Object.entries(variants.value) as [color, colorVariants] (color)}
      {@render colorBlock(colorVariants)}
    {/each}
  {/if}
</main>

<style>
  main {
    --width: 500px;
    --max-witdh: var(--width);
    width: var(--width);
    display: flex;
    flex-direction: column;
    color: white;
    padding: 1rem;
    min-height: 100vh;
    gap: 1rem;
  }

  .empty-state {
    text-align: center;
    padding: 2rem;
    font-size: 1rem;
    opacity: 0.8;
  }

  .color-container {
    max-width: var(--max-witdh);
    margin: 0 auto;
    border-radius: 0.5rem;
    margin-bottom: 0.25rem;
    overflow: hidden;
  }

  .color-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
  }

  .color-item {
    background-color: var(--color);
    color: var(--text-color);
    transition: opacity 0.2s ease;
  }

  .color-item:hover {
    opacity: 0.9;
  }

  .color-info {
    padding: 0.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }

  .color-name {
    font-size: 0.875rem;
    font-weight: 500;
  }

  .contrast-indicator {
    font-size: 0.75rem;
    padding: 2px 8px;
    border-radius: 4px;
    background-color: rgba(255, 255, 255, 0.2);
    width: fit-content;
  }

  .contrast-indicator.selected {
    background-color: rgba(255, 255, 255, 0.3);
  }

  .selected {
    box-shadow: 0 0 0 2px var(--text-color);
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
