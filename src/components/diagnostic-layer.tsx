import type { RefObject } from "react"
import type { Diagnostic } from "@stack-sh/engine"

import { diagnosticLines } from "@/lib/diagnostic-lines"
import { cn } from "@/lib/utils"

interface DiagnosticLayerProps {
  diagnostics: readonly Diagnostic[]
  layerRef: RefObject<HTMLPreElement | null>
  source: string
}

export function DiagnosticLayer({ diagnostics, layerRef, source }: DiagnosticLayerProps) {
  const lines = diagnosticLines(source, diagnostics)

  return (
    <pre
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10 m-0 overflow-hidden p-4 font-mono text-[0.8125rem] leading-[1.65rem] whitespace-pre text-transparent"
      ref={layerRef}
    >
      <code>
        {lines.map((parts, line) => (
          <span className="block h-[1.65rem] min-w-max" key={line}>
            {parts.map((part) => (
              <span
                className={cn(
                  part.severity === "error" &&
                    (part.point
                      ? "border-l-2 border-destructive"
                      : "bg-destructive/15 underline decoration-wavy decoration-1 decoration-destructive underline-offset-2"),
                  part.severity === "warning" &&
                    (part.point
                      ? "border-l-2 border-foreground/70"
                      : "bg-foreground/10 underline decoration-wavy decoration-1 decoration-foreground/70 underline-offset-2"),
                )}
                data-diagnostic-severity={part.severity ?? undefined}
                key={part.key}
              >
                {part.point ? "\u200b" : part.text || "\u200b"}
              </span>
            ))}
          </span>
        ))}
      </code>
    </pre>
  )
}
