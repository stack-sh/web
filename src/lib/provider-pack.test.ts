import { describe, expect, it } from "vitest"

import { loadProviderPackFiles } from "./provider-pack"

const manifest = {
  packVersion: "0.1.0",
  provider: { id: "example", name: "Example Cloud" },
  source: {
    pageUrl: "https://example.com/icons",
    release: "fixture-1",
    reviewAfter: "2026-12-03",
    termsUrl: "https://example.com/terms",
  },
  additionalSources: [
    {
      id: "categories",
      pageUrl: "https://example.com/categories",
      release: "fixture-categories-1",
      reviewAfter: "2026-12-04",
      termsUrl: "https://example.com/category-terms",
    },
  ],
  icons: [
    {
      asset: { path: "assets/storage.svg" },
      id: "example:storage",
      productName: "Example Storage",
    },
  ],
}

describe("loadProviderPackFiles", () => {
  it("creates a JSON-compatible engine input from local files", async () => {
    const result = await loadProviderPackFiles([
      new File([JSON.stringify(manifest)], "manifest.json", { type: "application/json" }),
      new File(["<svg />"], "storage.svg", { type: "image/svg+xml" }),
    ])

    expect(result.providerId).toBe("example")
    expect(result.icons).toEqual([
      { id: "example:storage", productName: "Example Storage", svg: "<svg />" },
    ])
    expect(result.input.assets).toEqual([{ path: "assets/storage.svg", svg: "<svg />" }])
    expect(result.sources).toEqual([
      {
        id: "primary",
        pageUrl: "https://example.com/icons",
        release: "fixture-1",
        reviewAfter: "2026-12-03",
        termsUrl: "https://example.com/terms",
      },
      {
        id: "categories",
        pageUrl: "https://example.com/categories",
        release: "fixture-categories-1",
        reviewAfter: "2026-12-04",
        termsUrl: "https://example.com/category-terms",
      },
    ])
  })

  it("rejects unsafe links before they reach the UI", async () => {
    const unsafeManifest = {
      ...manifest,
      source: { ...manifest.source, termsUrl: "javascript:alert(1)" },
    }

    await expect(
      loadProviderPackFiles([
        new File([JSON.stringify(unsafeManifest)], "manifest.json"),
        new File(["<svg />"], "storage.svg"),
      ]),
    ).rejects.toThrow("must be a valid HTTPS URL")
  })

  it("requires every declared asset", async () => {
    await expect(
      loadProviderPackFiles([new File([JSON.stringify(manifest)], "manifest.json")]),
    ).rejects.toThrow("Select the provider asset 'assets/storage.svg'")
  })
})
