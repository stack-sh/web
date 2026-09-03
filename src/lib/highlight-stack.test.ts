import { describe, expect, it } from "vitest"

import { highlightStack, STACK_SYNTAX_PALETTES } from "./highlight-stack"

function relativeLuminance(hex: string) {
  const channels = hex
    .slice(1)
    .match(/../g)!
    .map((part) => Number.parseInt(part, 16) / 255)
    .map((channel) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4))

  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
}

function contrastRatio(foreground: string, background: string) {
  const luminances = [relativeLuminance(foreground), relativeLuminance(background)].sort(
    (left, right) => right - left,
  )
  return (luminances[0] + 0.05) / (luminances[1] + 0.05)
}

describe("highlightStack", () => {
  const source =
    'stack 1.0\n// system boundary\ndiagram "API" { layout { direction right } edge api -> db }'

  it("uses distinct light-theme colors for Stack scopes", async () => {
    const lines = await highlightStack(source, "light")
    const tokens = lines.flat()
    const declaration = tokens.find((token) => token.content === "diagram")
    const property = tokens.find((token) => token.content === "direction")
    const comment = tokens.find((token) => token.content === "// system boundary")
    const value = tokens.find((token) => token.content === "right")
    const operator = tokens.find((token) => token.content === "->")

    expect(declaration?.fontStyle).toBe(2)
    expect(declaration?.color).toBe("#CF222E")
    expect(property?.color).toBe("#8250DF")
    expect(comment?.fontStyle).toBe(1)
    expect(value?.color).toBe("#116329")
    expect(operator?.color).toBe("#0550AE")
  })

  it("uses a high-contrast dark-theme palette", async () => {
    const tokens = (await highlightStack(source, "dark")).flat()

    expect(tokens.find((token) => token.content === "diagram")?.color).toBe("#FF7B72")
    expect(tokens.find((token) => token.content === "direction")?.color).toBe("#D2A8FF")
    expect(tokens.find((token) => token.content === "right")?.color).toBe("#7EE787")
    expect(tokens.find((token) => token.content === "->")?.color).toBe("#79C0FF")
  })

  it.each(Object.entries(STACK_SYNTAX_PALETTES))(
    "keeps every %s syntax color at WCAG AA contrast",
    (_, palette) => {
      for (const [name, color] of Object.entries(palette)) {
        if (name === "background") continue
        expect(contrastRatio(color, palette.background)).toBeGreaterThanOrEqual(4.5)
      }
    },
  )
})
