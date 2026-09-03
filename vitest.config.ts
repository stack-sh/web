import path from "node:path"

import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
      "@stack-sh/engine": path.resolve(
        import.meta.dirname,
        "./vendor/engine/packages/engine/index.js",
      ),
    },
  },
  test: {
    clearMocks: true,
    environment: "jsdom",
    include: ["src/**/*.test.ts?(x)"],
    setupFiles: ["./src/test/setup.ts"],
  },
})
