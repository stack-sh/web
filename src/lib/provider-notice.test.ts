import { describe, expect, it } from "vitest"

import { providerNoticeMarkdown } from "./provider-notice"

describe("providerNoticeMarkdown", () => {
  it("preserves provider provenance and used icon names", () => {
    const output = providerNoticeMarkdown([
      {
        archiveSha256: "sha256:archive",
        attribution: "Example attribution.",
        icons: [{ id: "example:storage", productName: "Example Storage" }],
        nonEndorsement: "Example does not endorse Stack.",
        packRevision: "sha256:pack",
        packVersion: "0.1.0",
        providerId: "example",
        providerName: "Example Cloud",
        sourceRelease: "fixture-1",
        termsSummary: "Architecture diagrams only.",
        termsUrl: "https://example.com/terms",
      },
    ])

    expect(output).toContain("## Example Cloud (`example`)")
    expect(output).toContain("`example:storage` — Example Storage")
    expect(output).toContain("<https://example.com/terms>")
  })
})
