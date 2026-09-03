import { sourceCodeFrame } from "@/lib/source-position"
import { cn } from "@/lib/utils"
import type { Diagnostic, SourceRange } from "@stack-sh/engine"

interface DiagnosticsProps {
  diagnostics: readonly Diagnostic[]
  source: string
  onSelectRange: (range: SourceRange) => void
}

export function Diagnostics({ diagnostics, source, onSelectRange }: DiagnosticsProps) {
  return (
    <section
      aria-label="Diagnostics"
      aria-live="polite"
      className="max-h-64 overflow-auto border-t bg-background"
    >
      <div className="flex h-9 items-center justify-between border-b px-3 text-xs">
        <h3 className="font-medium" id="diagnostics-heading">
          Diagnostics
        </h3>
        <span className="font-mono text-muted-foreground">{diagnostics.length}</span>
      </div>

      {diagnostics.length === 0 ? (
        <p className="px-3 py-3 text-xs text-muted-foreground">No diagnostics.</p>
      ) : (
        <ol className="divide-y">
          {diagnostics.map((diagnostic, index) => {
            const frame = sourceCodeFrame(source, diagnostic.range)
            const location = `${diagnostic.range.start.line}:${diagnostic.range.start.column}`

            return (
              <li className="px-3 py-3 text-xs" key={`${diagnostic.code}-${index}`}>
                <button
                  aria-label={`Go to ${diagnostic.severity} ${diagnostic.code} at ${location}`}
                  className="flex w-full flex-wrap items-baseline gap-x-2 gap-y-1 rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  onClick={() => onSelectRange(diagnostic.range)}
                  type="button"
                >
                  <span
                    className={cn(
                      "font-semibold uppercase tracking-wide",
                      diagnostic.severity === "error" ? "text-destructive" : "text-foreground",
                    )}
                  >
                    {diagnostic.severity}
                  </span>
                  <code className="font-mono text-muted-foreground">[{diagnostic.code}]</code>
                  <span className="font-mono text-muted-foreground">at {location}</span>
                </button>

                <p className="mt-1.5 leading-5 text-foreground">{diagnostic.message}</p>

                <div className="mt-2 overflow-x-auto border bg-editor py-2 font-mono leading-5">
                  <div className="grid min-w-max grid-cols-[2rem_1rem_1fr] px-2">
                    <span className="text-right text-muted-foreground">{frame.line}</span>
                    <span aria-hidden="true" className="text-center text-muted-foreground">
                      |
                    </span>
                    <code className="whitespace-pre">
                      {frame.before}
                      <span
                        className={cn(
                          "border-b-2 bg-foreground/10",
                          diagnostic.severity === "error"
                            ? "border-destructive bg-destructive/10"
                            : "border-foreground",
                        )}
                      >
                        {frame.marked || "\u200b"}
                      </span>
                      {frame.after}
                    </code>
                  </div>
                </div>

                {diagnostic.expected.length > 0 ? (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5 leading-5">
                    <span className="text-muted-foreground">Expected</span>
                    {diagnostic.expected.map((expected) => (
                      <code className="border bg-muted px-1.5 font-mono" key={expected}>
                        {expected}
                      </code>
                    ))}
                  </div>
                ) : null}

                {diagnostic.help ? (
                  <p className="mt-1.5 leading-5 text-muted-foreground">
                    <span className="font-medium text-foreground">Help:</span> {diagnostic.help}
                  </p>
                ) : null}

                {diagnostic.related.length > 0 ? (
                  <div className="mt-2 border-l-2 pl-2">
                    <p className="mb-1 text-muted-foreground">Related</p>
                    {diagnostic.related.map((related, relatedIndex) => (
                      <button
                        className="block rounded-sm text-left leading-5 underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        key={`${related.range.start.byteOffset}-${relatedIndex}`}
                        onClick={() => onSelectRange(related.range)}
                        type="button"
                      >
                        {related.message} at {related.range.start.line}:{related.range.start.column}
                      </button>
                    ))}
                  </div>
                ) : null}
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
