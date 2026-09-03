import type { Diagnostic } from "@stack-sh/engine"

interface DiagnosticsProps {
  diagnostics: readonly Diagnostic[]
}

export function Diagnostics({ diagnostics }: DiagnosticsProps) {
  return (
    <section
      aria-label="Diagnostics"
      aria-live="polite"
      className="max-h-44 overflow-auto border-t bg-white"
    >
      <div className="flex h-9 items-center justify-between border-b px-3 text-xs">
        <h3 className="font-medium">Diagnostics</h3>
        <span className="font-mono text-muted-foreground">{diagnostics.length}</span>
      </div>

      {diagnostics.length === 0 ? (
        <p className="px-3 py-3 text-xs text-muted-foreground">No diagnostics.</p>
      ) : (
        <ol className="divide-y">
          {diagnostics.map((diagnostic, index) => (
            <li className="px-3 py-2.5 text-xs" key={`${diagnostic.code}-${index}`}>
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span
                  className={
                    diagnostic.severity === "error"
                      ? "font-medium text-destructive"
                      : "font-medium text-foreground"
                  }
                >
                  {diagnostic.severity === "error" ? "Error" : "Warning"}
                </span>
                <code className="font-mono text-muted-foreground">{diagnostic.code}</code>
                <span className="font-mono text-muted-foreground">
                  {diagnostic.range.start.line}:{diagnostic.range.start.column}
                </span>
              </div>
              <p className="mt-1 leading-5 text-foreground">{diagnostic.message}</p>
              {diagnostic.help ? (
                <p className="mt-1 leading-5 text-muted-foreground">{diagnostic.help}</p>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
