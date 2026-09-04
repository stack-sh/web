import { describe, expect, it } from "vitest"

import { providerNoticeMarkdown } from "./provider-notice"

describe("providerNoticeMarkdown", () => {
  it("preserves provider provenance and used icon names", () => {
    const output = providerNoticeMarkdown([
      {
        archiveSha256: "sha256:archive",
        attribution: "Example attribution.",
        icons: [
          {
            brandGuidelinesUrl: "https://example.com/brand",
            brandSourceUrl: "https://example.com/storage",
            id: "example:storage",
            productName: "Example Storage",
            sourceId: "categories",
          },
        ],
        nonEndorsement: "Example does not endorse Stack.",
        packRevision: "sha256:pack",
        packVersion: "0.1.0",
        providerId: "example",
        providerName: "Example Cloud",
        sourceRelease: "fixture-1",
        sources: [
          {
            archiveSha256: "sha256:archive",
            id: "categories",
            pageUrl: "https://example.com/icons",
            release: "fixture-1",
            termsUrl: "https://example.com/terms",
          },
        ],
        termsSummary: "Architecture diagrams only.",
        termsUrl: "https://example.com/terms",
      },
    ])

    expect(output).toContain("## Example Cloud (`example`)")
    expect(output).toContain("`example:storage` — Example Storage (source `categories`)")
    expect(output).toContain("<https://example.com/storage>")
    expect(output).toContain("<https://example.com/brand>")
    expect(output).toContain("<https://example.com/terms>")
  })
})
