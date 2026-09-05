import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react"
import type {
  CompletionResult,
  Diagnostic,
  EngineMetadata,
  HoverResult,
  ProviderNotice,
  SourcePosition,
} from "@stack-sh/engine"

import { ColorModeToggle } from "@/components/color-mode-toggle"
import { EditorPane } from "@/components/editor-pane"
import { PreviewPane } from "@/components/preview-pane"
import { TooltipProvider } from "@/components/ui/tooltip"
import { applyColorMode, initialColorMode, saveColorMode, type ColorMode } from "@/lib/color-mode"
import { EXAMPLE_SOURCE } from "@/lib/example"
import type { LoadedProviderPack } from "@/lib/provider-pack"
import {
  checkStack,
  completeStack,
  formatStack,
  hoverStack,
  initializeStackEngine,
  renderStack,
  validateProviderPack,
} from "@/lib/stack-engine"

const ProviderIcons = lazy(() => import("@/components/provider-icons"))
const INPUT_RENDER_DELAY_MS = 180

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
  const [colorMode, setColorMode] = useState<ColorMode>(initialColorMode)
  const [source, setSource] = useState(EXAMPLE_SOURCE)
  const [documentVersion, setDocumentVersion] = useState(0)
  const [analysisRevision, setAnalysisRevision] = useState(0)
  const [diagnostics, setDiagnostics] = useState<readonly Diagnostic[]>([])
  const [svg, setSvg] = useState<string | null>(null)
  const [metadata, setMetadata] = useState<EngineMetadata | null>(null)
  const [providerNotices, setProviderNotices] = useState<readonly ProviderNotice[]>([])
  const [providerPacks, setProviderPacks] = useState<readonly LoadedProviderPack[]>([])
  const [status, setStatus] = useState("Loading engine…")
  const [isReady, setIsReady] = useState(false)
  const sourceRef = useRef(EXAMPLE_SOURCE)
  const providerPacksRef = useRef<readonly LoadedProviderPack[]>([])
  const documentVersionRef = useRef(0)
  const analysisRevisionRef = useRef(0)
  const lastRenderedRevisionRef = useRef(-1)
  const scheduledRenderRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    applyColorMode(colorMode)
  }, [colorMode])

  const reportFailure = useCallback((error: unknown) => {
    setSvg(null)
    setProviderNotices([])
    setStatus(errorMessage(error))
  }, [])

  const cancelScheduledRender = useCallback(() => {
    if (!scheduledRenderRef.current) return
    clearTimeout(scheduledRenderRef.current)
    scheduledRenderRef.current = null
  }, [])

  const runRender = useCallback(
    (
      nextSource: string,
      packs: readonly LoadedProviderPack[],
      revision: number,
      action = "Render",
    ) => {
      try {
        const result = renderStack(
          nextSource,
          packs.map((pack) => pack.input),
        )
        if (revision !== analysisRevisionRef.current) return

        lastRenderedRevisionRef.current = revision
        setDiagnostics(result.diagnostics)
        setMetadata(result.metadata)
        setSvg(result.svg)
        setProviderNotices(result.providerNotices)
        setStatus(resultStatus(action, result.diagnostics))
      } catch (error) {
        if (revision === analysisRevisionRef.current) reportFailure(error)
      }
    },
    [reportFailure],
  )

  useEffect(() => {
    let active = true

    initializeStackEngine()
      .then(() => {
        if (!active) return
        setIsReady(true)
        runRender(sourceRef.current, providerPacksRef.current, analysisRevisionRef.current)
      })
      .catch((error: unknown) => {
        if (active) reportFailure(error)
      })

    return () => {
      active = false
    }
  }, [reportFailure, runRender])

  useEffect(() => {
    if (!isReady || lastRenderedRevisionRef.current === analysisRevision) return

    scheduledRenderRef.current = setTimeout(() => {
      scheduledRenderRef.current = null
      runRender(source, providerPacks, analysisRevision)
    }, INPUT_RENDER_DELAY_MS)

    return () => {
      if (scheduledRenderRef.current) {
        clearTimeout(scheduledRenderRef.current)
        scheduledRenderRef.current = null
      }
    }
  }, [analysisRevision, isReady, providerPacks, runRender, source])

  const handleSourceChange = useCallback((nextSource: string) => {
    sourceRef.current = nextSource
    setSource(nextSource)

    const nextDocumentVersion = documentVersionRef.current + 1
    documentVersionRef.current = nextDocumentVersion
    setDocumentVersion(nextDocumentVersion)

    const nextRevision = analysisRevisionRef.current + 1
    analysisRevisionRef.current = nextRevision
    setAnalysisRevision(nextRevision)

    setDiagnostics([])
    setSvg(null)
    setProviderNotices([])
    setStatus("Analyzing source…")
    return nextDocumentVersion
  }, [])

  const handleRequestCompletion = useCallback(
    (snapshot: string, version: number, position: SourcePosition): CompletionResult =>
      completeStack(
        snapshot,
        version,
        position,
        providerPacksRef.current.map((pack) => pack.input),
      ),
    [],
  )

  const handleRequestHover = useCallback(
    (snapshot: string, version: number, position: SourcePosition): HoverResult =>
      hoverStack(snapshot, version, position),
    [],
  )

  function advanceProviderContext(packs: readonly LoadedProviderPack[]) {
    providerPacksRef.current = packs
    setProviderPacks(packs)

    const nextDocumentVersion = documentVersionRef.current + 1
    documentVersionRef.current = nextDocumentVersion
    setDocumentVersion(nextDocumentVersion)

    const nextRevision = analysisRevisionRef.current + 1
    analysisRevisionRef.current = nextRevision
    setAnalysisRevision(nextRevision)
    return nextRevision
  }

  function handleRender() {
    cancelScheduledRender()
    runRender(sourceRef.current, providerPacksRef.current, analysisRevisionRef.current)
  }

  function handleCheck() {
    cancelScheduledRender()
    try {
      const result = checkStack(
        sourceRef.current,
        providerPacksRef.current.map((pack) => pack.input),
      )
      setMetadata(result.metadata)
      runRender(sourceRef.current, providerPacksRef.current, analysisRevisionRef.current, "Check")
    } catch (error) {
      reportFailure(error)
    }
  }

  function handleFormat() {
    cancelScheduledRender()
    try {
      const result = formatStack(sourceRef.current)
      setDiagnostics(result.diagnostics)
      setMetadata(result.metadata)
      setStatus(resultStatus("Format", result.diagnostics))

      if (result.formattedSource !== null) {
        const formattedSource = result.formattedSource
        const nextVersion = handleSourceChange(formattedSource)
        const nextRevision = analysisRevisionRef.current
        documentVersionRef.current = nextVersion
        runRender(formattedSource, providerPacksRef.current, nextRevision, "Format")
      }
    } catch (error) {
      reportFailure(error)
    }
  }

  function handleColorModeChange(nextColorMode: ColorMode) {
    setColorMode(nextColorMode)
    saveColorMode(nextColorMode)
  }

  function handleProviderIconStoreLoad(packs: readonly LoadedProviderPack[]) {
    for (const pack of packs) validateProviderPack(pack.input)
    cancelScheduledRender()
    const nextRevision = advanceProviderContext(packs)
    runRender(sourceRef.current, packs, nextRevision)
  }

  function handleProviderPackRemove(providerId: string) {
    const nextPacks = providerPacksRef.current.filter((pack) => pack.providerId !== providerId)
    cancelScheduledRender()
    const nextRevision = advanceProviderContext(nextPacks)
    runRender(sourceRef.current, nextPacks, nextRevision)
  }

  return (
    <TooltipProvider>
      <div className="flex min-h-svh flex-col bg-background lg:h-svh lg:overflow-hidden">
        <header className="flex h-12 shrink-0 items-center justify-between border-b px-3 sm:px-4">
          <h1 className="sr-only">Stack Playground</h1>
          <div className="flex h-full items-center">
            <a
              className="flex items-center gap-2 text-sm font-semibold tracking-[-0.02em]"
              href="/"
            >
              <img
                alt=""
                className="size-5 rounded-[3px]"
                height="20"
                src="/favicon.svg"
                width="20"
              />
              <span>Stack</span>
            </a>
            <span aria-hidden="true" className="mx-3 h-4 w-px bg-border" />
            <span className="text-sm text-muted-foreground">Playground</span>
          </div>

          <nav aria-label="Primary" className="flex items-center gap-2 sm:gap-4">
            <a
              className="rounded-sm text-xs text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              href="/docs/"
            >
              Docs
            </a>
            <a
              className="hidden rounded-sm text-xs text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:inline"
              href="https://github.com/stack-sh"
              rel="noreferrer"
              target="_blank"
            >
              GitHub
            </a>
            <Suspense fallback={null}>
              <ProviderIcons
                disabled={!isReady}
                onLoad={handleProviderIconStoreLoad}
                onRemove={handleProviderPackRemove}
                packs={providerPacks}
              />
            </Suspense>
            <ColorModeToggle colorMode={colorMode} onColorModeChange={handleColorModeChange} />
          </nav>
        </header>

        <main className="grid flex-1 grid-cols-1 lg:h-0 lg:min-h-0 lg:grid-cols-2">
          <EditorPane
            colorMode={colorMode}
            diagnostics={diagnostics}
            disabled={!isReady}
            documentVersion={documentVersion}
            onCheck={handleCheck}
            onFormat={handleFormat}
            onRender={handleRender}
            onRequestCompletion={handleRequestCompletion}
            onRequestHover={handleRequestHover}
            onSourceChange={handleSourceChange}
            source={source}
          />
          <PreviewPane
            engineVersion={metadata?.engineVersion ?? null}
            isLoading={!isReady}
            providerNotices={providerNotices}
            status={status}
            svg={svg}
          />
        </main>
      </div>
    </TooltipProvider>
  )
}
