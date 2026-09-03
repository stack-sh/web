import { describe, expect, it } from "vitest"

import { highlightStack } from "./highlight-stack"

describe("highlightStack", () => {
  it("tokenizes Stack source with the shared TextMate grammar", async () => {
    const lines = await highlightStack(
      'stack 1.0\n// system boundary\ndiagram "API" { layout { direction right } }',
    )
    const tokens = lines.flat()
    const declaration = tokens.find((token) => token.content === "diagram")
    const comment = tokens.find((token) => token.content === "// system boundary")
    const value = tokens.find((token) => token.content === "right")

    expect(declaration?.fontStyle).toBe(2)
    expect(comment?.fontStyle).toBe(1)
    expect(value?.color).toBe("#525252")
  })
})
