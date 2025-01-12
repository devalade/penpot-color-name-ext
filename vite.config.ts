import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      input: {
        plugin: "src/plugin.ts",
        index: "./index.html",
      },
      output: {
        entryFileNames: "[name].js",
        manualChunks: {
          'color-data': ['color-name-list'],
          // Add other vendor chunks as needed
          'vendor': ['svelte']
        }
      },
    },
    chunkSizeWarningLimit: 600
  },
  preview: {
    port: 3000,
  },
});
