import path from "node:path"
import { readFileSync } from "node:fs"

import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { readProductHome, renderProductMetadata } from "./scripts/product-home.mjs"

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "stack-product-metadata",
      transformIndexHtml(html) {
        const copy = readProductHome(readFileSync(path.resolve("docs/index.md"), "utf8"))
        return renderProductMetadata(html, copy)
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
})
