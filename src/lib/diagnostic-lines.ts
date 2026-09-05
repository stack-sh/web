import type { Diagnostic } from "@stack-sh/engine"

import { sourceSelection } from "@/lib/source-position"

type Severity = Diagnostic["severity"]

export interface MarkedDiagnosticPart {
  key: string
  text: string
  severity: Severity | null
  point: boolean
}

export function diagnosticLines(
  source: string,
  diagnostics: readonly Diagnostic[],
): readonly (readonly MarkedDiagnosticPart[])[] {
  const ranges = diagnostics.map((diagnostic) => ({
    ...sourceSelection(source, diagnostic.range),
    severity: diagnostic.severity,
  }))
  const lines = source.split("\n")
  let lineStart = 0

  return lines.map((line, lineIndex) => {
    const marks: Array<Severity | null> = Array.from({ length: line.length }, () => null)
    const points = new Map<number, Severity>()
    const lineEnd = lineStart + line.length

    for (const range of ranges) {
      if (range.start === range.end) {
        if (range.start >= lineStart && range.start <= lineEnd) {
          const offset = range.start - lineStart
          points.set(offset, strongerSeverity(points.get(offset), range.severity))
        }
        continue
      }

      const start = Math.max(lineStart, range.start)
      const end = Math.min(lineEnd, range.end)
      for (let index = start; index < end; index += 1) {
        const offset = index - lineStart
        marks[offset] = strongerSeverity(marks[offset] ?? undefined, range.severity)
      }
    }

    const parts: MarkedDiagnosticPart[] = []
    let index = 0
    while (index < line.length) {
      const point = points.get(index)
      if (point) {
        parts.push({ key: `${lineIndex}-${index}-point`, point: true, severity: point, text: "" })
      }
      const severity = marks[index]
      let end = index + 1
      while (end < line.length && marks[end] === severity && !points.has(end)) end += 1
      parts.push({
        key: `${lineIndex}-${index}-${end}`,
        point: false,
        severity,
        text: line.slice(index, end),
      })
      index = end
    }
    const finalPoint = points.get(line.length)
    if (finalPoint) {
      parts.push({
        key: `${lineIndex}-${line.length}-point`,
        point: true,
        severity: finalPoint,
        text: "",
      })
    }
    if (parts.length === 0) {
      parts.push({ key: `${lineIndex}-empty`, point: false, severity: null, text: "" })
    }
    lineStart = lineEnd + 1
    return parts
  })
}

function strongerSeverity(current: Severity | undefined, next: Severity): Severity {
  return current === "error" || next === "error" ? "error" : "warning"
}
