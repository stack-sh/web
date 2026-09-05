import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { diagnosticLines } from "@/lib/diagnostic-lines"

import { DiagnosticLayer } from "./diagnostic-layer"

describe("DiagnosticLayer", () => {
  it("marks UTF-8 ranges and point diagnostics without duplicating accessible text", () => {
    const source = 'node café "😀"\nlayout { direction hoo }'
    const start = new TextEncoder().encode(source.slice(0, source.indexOf("hoo"))).length
    const end = start + 3
    const diagnostics = [
      {
        code: "STK2002",
        expected: ["right", "down"],
        help: null,
        message: "Unknown direction.",
        range: {
          end: { byteOffset: end, column: 25, line: 2 },
          start: { byteOffset: start, column: 22, line: 2 },
        },
        related: [],
        severity: "error" as const,
      },
      {
        code: "STK2001",
        expected: [],
        help: null,
        message: "Close the document.",
        range: {
          end: { byteOffset: end, column: 25, line: 2 },
          start: { byteOffset: end, column: 25, line: 2 },
        },
        related: [],
        severity: "warning" as const,
      },
    ]

    const lines = diagnosticLines(source, diagnostics)
    expect(lines[1].find((part) => part.severity === "error")?.text).toBe("hoo")
    expect(lines[1].some((part) => part.point && part.severity === "warning")).toBe(true)

    const { container } = render(
      <DiagnosticLayer diagnostics={diagnostics} layerRef={{ current: null }} source={source} />,
    )
    expect(container.querySelector("pre")).toHaveAttribute("aria-hidden", "true")
    expect(container.querySelectorAll('[data-diagnostic-severity="error"]')).toHaveLength(1)
    expect(container.querySelectorAll('[data-diagnostic-severity="warning"]')).toHaveLength(1)
  })

  it("keeps the stronger diagnostic when ranges overlap", () => {
    const source = "abc"
    const range = {
      end: { byteOffset: 2, column: 3, line: 1 },
      start: { byteOffset: 1, column: 2, line: 1 },
    }
    const diagnostics = ["warning", "error"].map((severity, index) => ({
      code: `STK${index}`,
      expected: [],
      help: null,
      message: "message",
      range,
      related: [],
      severity: severity as "warning" | "error",
    }))

    expect(
      diagnosticLines(source, diagnostics)[0].find((part) => part.text === "b")?.severity,
    ).toBe("error")
  })
})
