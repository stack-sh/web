import { useCallback, useEffect, useState } from "react"
import type { Diagnostic, EngineMetadata } from "@stack-sh/engine"

import { EditorPane } from "@/components/editor-pane"
import { PreviewPane } from "@/components/preview-pane"
import { TooltipProvider } from "@/components/ui/tooltip"
import { EXAMPLE_SOURCE } from "@/lib/example"
import { checkStack, formatStack, initializeStackEngine, renderStack } from "@/lib/stack-engine"

function hasErrors(diagnostics: readonly Diagnostic[]) {
  return diagnostics.some((diagnostic) => diagnostic.severity === "error")
}

function resultStatus(action: string, diagnostics: readonly Diagnostic[]) {
  if (hasErrors(diagnostics)) return `${action} found errors`
  if (diagnostics.length > 0) return `${action} completed with warnings`
  return `${action} completed`
}

function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "The Stack engine could not complete the operation."
}

export default function App() {
  const [source, setSource] = useState(EXAMPLE_SOURCE)
  const [diagnostics, setDiagnostics] = useState<readonly Diagnostic[]>([])
  const [svg, setSvg] = useState<string | null>(null)
  const [metadata, setMetadata] = useState<EngineMetadata | null>(null)
  const [status, setStatus] = useState("Loading engine…")
  const [isReady, setIsReady] = useState(false)

  const reportFailure = useCallback((error: unknown) => {
    setSvg(null)
    setStatus(errorMessage(error))
  }, [])

  const runRender = useCallback((nextSource: string) => {
    const result = renderStack(nextSource)
    setDiagnostics(result.diagnostics)
    setMetadata(result.metadata)
    setSvg(result.svg)
    setStatus(resultStatus("Render", result.diagnostics))
  }, [])

  useEffect(() => {
    let active = true

    initializeStackEngine()
      .then(() => {
        if (!active) return
        setIsReady(true)
        runRender(EXAMPLE_SOURCE)
      })
      .catch((error: unknown) => {
        if (active) reportFailure(error)
      })

    return () => {
      active = false
    }
  }, [reportFailure, runRender])

  function handleRender() {
    try {
      runRender(source)
    } catch (error) {
      reportFailure(error)
    }
  }

  function handleSourceChange(nextSource: string) {
    setSource(nextSource)
    setDiagnostics([])
    setStatus("Source changed")
  }

  function handleCheck() {
    try {
      const result = checkStack(source)
      setDiagnostics(result.diagnostics)
      setMetadata(result.metadata)
      setStatus(resultStatus("Check", result.diagnostics))
    } catch (error) {
      reportFailure(error)
    }
  }

  function handleFormat() {
    try {
      const result = formatStack(source)
      setDiagnostics(result.diagnostics)
      setMetadata(result.metadata)
      setStatus(resultStatus("Format", result.diagnostics))

      if (result.formattedSource !== null) {
        setSource(result.formattedSource)
        const rendered = renderStack(result.formattedSource)
        setSvg(rendered.svg)
      }
    } catch (error) {
      reportFailure(error)
    }
  }

  return (
    <TooltipProvider>
      <div className="flex min-h-svh flex-col bg-white lg:h-svh lg:overflow-hidden">
        <header className="flex h-12 shrink-0 items-center justify-between border-b px-3 sm:px-4">
          <div className="flex h-full items-center">
            <a className="text-sm font-semibold tracking-[-0.02em]" href="/">
              Stack
            </a>
            <span aria-hidden="true" className="mx-3 h-4 w-px bg-border" />
            <span className="text-sm text-muted-foreground">Playground</span>
          </div>

          <nav aria-label="Primary" className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground">Docs later</span>
            <a
              className="rounded-sm text-xs text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              href="https://github.com/stack-sh"
              rel="noreferrer"
              target="_blank"
            >
              GitHub
            </a>
          </nav>
        </header>

        <main className="grid flex-1 grid-cols-1 lg:h-0 lg:min-h-0 lg:grid-cols-2">
          <EditorPane
            diagnostics={diagnostics}
            disabled={!isReady}
            onCheck={handleCheck}
            onFormat={handleFormat}
            onRender={handleRender}
            onSourceChange={handleSourceChange}
            source={source}
          />
          <PreviewPane
            engineVersion={metadata?.engineVersion ?? null}
            isLoading={!isReady}
            status={status}
            svg={svg}
          />
        </main>
      </div>
    </TooltipProvider>
  )
}
