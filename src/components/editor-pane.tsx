/* oxlint-disable jsx-a11y/prefer-tag-over-role -- Native select controls cannot preserve textarea focus or render completion metadata. */

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react"
import { Braces, CircleCheck, Play } from "lucide-react"
import type {
  CompletionItem,
  CompletionResult,
  Diagnostic,
  Hover,
  HoverResult,
  SourcePosition,
  SourceRange,
} from "@stack-sh/engine"

import { DiagnosticLayer } from "@/components/diagnostic-layer"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { ColorMode } from "@/lib/color-mode"
import { highlightStack } from "@/lib/highlight-stack"
import { applyTextEdit, sourcePositionAtUtf16Index, sourceSelection } from "@/lib/source-position"
import { cn } from "@/lib/utils"

import { Diagnostics } from "./diagnostics"
import { HighlightLayer } from "./highlight-layer"

interface EditorPaneProps {
  colorMode: ColorMode
  source: string
  documentVersion: number
  diagnostics: readonly Diagnostic[]
  disabled: boolean
  onSourceChange: (source: string) => number
  onRequestCompletion: (
    source: string,
    documentVersion: number,
    position: SourcePosition,
  ) => CompletionResult
  onRequestHover: (source: string, documentVersion: number, position: SourcePosition) => HoverResult
  onFormat: () => void
  onCheck: () => void
  onRender: () => void
}

interface PendingSelection {
  documentVersion: number
  index: number
  source: string
}

const MAX_VISIBLE_COMPLETIONS = 10

export function EditorPane({
  colorMode,
  source,
  documentVersion,
  diagnostics,
  disabled,
  onSourceChange,
  onRequestCompletion,
  onRequestHover,
  onFormat,
  onCheck,
  onRender,
}: EditorPaneProps) {
  const gutterRef = useRef<HTMLDivElement>(null)
  const highlightRef = useRef<HTMLPreElement>(null)
  const diagnosticLayerRef = useRef<HTMLPreElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const completionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const completionRequestRef = useRef(0)
  const completionSelectionRef = useRef<number | null>(null)
  const hoverRequestRef = useRef(0)
  const composingRef = useRef(false)
  const focusedRef = useRef(false)
  const latestSourceRef = useRef(source)
  const latestVersionRef = useRef(documentVersion)
  const pendingSelectionRef = useRef<PendingSelection | null>(null)
  const characterWidthRef = useRef<number | null>(null)
  const completionListId = useId()
  const contextId = useId()
  const intelligenceStatusId = useId()
  const [highlighted, setHighlighted] = useState<{
    source: string
    colorMode: ColorMode
    lines: Awaited<ReturnType<typeof highlightStack>>
  } | null>(null)
  const [isComposing, setIsComposing] = useState(false)
  const [completion, setCompletion] = useState<CompletionResult | null>(null)
  const [activeCompletion, setActiveCompletion] = useState(0)
  const [hoverState, setHoverState] = useState<{
    documentVersion: number
    hover: Hover | null
  } | null>(null)
  const [intelligenceErrorState, setIntelligenceErrorState] = useState<{
    documentVersion: number
    message: string
  } | null>(null)

  const completionItems = useMemo(
    () =>
      completion?.documentVersion === documentVersion
        ? completion.items.slice(0, MAX_VISIBLE_COMPLETIONS)
        : [],
    [completion, documentVersion],
  )
  const hover = hoverState?.documentVersion === documentVersion ? hoverState.hover : null
  const intelligenceError =
    intelligenceErrorState?.documentVersion === documentVersion
      ? intelligenceErrorState.message
      : null
  const lineNumbers = useMemo(
    () => Array.from({ length: source.split("\n").length }, (_, index) => index + 1),
    [source],
  )
  const diagnosticGutterLines = useMemo(() => {
    const lines = new Map<number, Diagnostic["severity"]>()
    for (const diagnostic of diagnostics) {
      const line = diagnostic.range.start.line
      if (diagnostic.severity === "error" || !lines.has(line)) {
        lines.set(line, diagnostic.severity)
      }
    }
    return lines
  }, [diagnostics])

  useEffect(() => {
    let active = true
    highlightStack(source, colorMode)
      .then((lines) => {
        if (active) setHighlighted({ source, colorMode, lines })
      })
      .catch(() => {
        if (active) setHighlighted(null)
      })
    return () => {
      active = false
    }
  }, [colorMode, source])

  useEffect(
    () => () => {
      if (completionTimerRef.current) clearTimeout(completionTimerRef.current)
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
    },
    [],
  )

  const requestCompletion = useCallback(
    (snapshot: string, version: number, selection: number, delay: number) => {
      if (disabled || composingRef.current) return
      if (completionTimerRef.current) clearTimeout(completionTimerRef.current)
      completionSelectionRef.current = selection
      const request = completionRequestRef.current + 1
      completionRequestRef.current = request

      completionTimerRef.current = setTimeout(() => {
        try {
          const result = onRequestCompletion(
            snapshot,
            version,
            sourcePositionAtUtf16Index(snapshot, selection),
          )
          if (
            request !== completionRequestRef.current ||
            !focusedRef.current ||
            composingRef.current ||
            textareaRef.current?.selectionStart !== selection ||
            textareaRef.current?.selectionEnd !== selection ||
            snapshot !== latestSourceRef.current ||
            version !== latestVersionRef.current ||
            result.documentVersion !== version
          ) {
            return
          }
          setCompletion(result.items.length > 0 ? result : null)
          setActiveCompletion(0)
          setIntelligenceErrorState(null)
        } catch (error) {
          if (request !== completionRequestRef.current) return
          setCompletion(null)
          setIntelligenceErrorState({ documentVersion: version, message: errorMessage(error) })
        }
      }, delay)
    },
    [disabled, onRequestCompletion],
  )

  const requestHover = useCallback(
    (snapshot: string, version: number, selection: number, delay: number) => {
      if (disabled || composingRef.current) return
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
      const request = hoverRequestRef.current + 1
      hoverRequestRef.current = request

      hoverTimerRef.current = setTimeout(() => {
        try {
          let result = onRequestHover(
            snapshot,
            version,
            sourcePositionAtUtf16Index(snapshot, selection),
          )
          if (result.documentVersion !== version) return
          if (result.hover === null && selection > 0) {
            const previous = onRequestHover(
              snapshot,
              version,
              sourcePositionAtUtf16Index(snapshot, selection - 1),
            )
            if (previous.documentVersion !== version) return
            result = previous
          }
          if (
            request !== hoverRequestRef.current ||
            snapshot !== latestSourceRef.current ||
            version !== latestVersionRef.current
          ) {
            return
          }
          setHoverState({ documentVersion: version, hover: result.hover })
          setIntelligenceErrorState(null)
        } catch (error) {
          if (request !== hoverRequestRef.current) return
          setHoverState(null)
          setIntelligenceErrorState({ documentVersion: version, message: errorMessage(error) })
        }
      }, delay)
    },
    [disabled, onRequestHover],
  )

  useLayoutEffect(() => {
    latestSourceRef.current = source
    latestVersionRef.current = documentVersion
  }, [documentVersion, source])

  useLayoutEffect(() => {
    const pending = pendingSelectionRef.current
    const textarea = textareaRef.current
    if (
      !pending ||
      !textarea ||
      pending.source !== source ||
      pending.documentVersion !== documentVersion
    ) {
      return
    }

    pendingSelectionRef.current = null
    textarea.focus()
    textarea.setSelectionRange(pending.index, pending.index)
    requestHover(source, documentVersion, pending.index, 0)
  }, [documentVersion, requestHover, source])

  const syncScroll = useCallback((textarea: HTMLTextAreaElement) => {
    if (gutterRef.current) gutterRef.current.scrollTop = textarea.scrollTop
    for (const layer of [highlightRef.current, diagnosticLayerRef.current]) {
      if (!layer) continue
      layer.scrollTop = textarea.scrollTop
      layer.scrollLeft = textarea.scrollLeft
    }
  }, [])

  function selectRange(range: SourceRange) {
    const textarea = textareaRef.current
    if (!textarea) return

    const selection = sourceSelection(source, range)
    textarea.focus()
    textarea.setSelectionRange(selection.start, selection.end)
    requestHover(source, documentVersion, selection.start, 0)

    const lineHeight = Number.parseFloat(getComputedStyle(textarea).lineHeight) || 26.4
    const selectionTop = (range.start.line - 1) * lineHeight
    if (
      selectionTop < textarea.scrollTop ||
      selectionTop + lineHeight > textarea.scrollTop + textarea.clientHeight
    ) {
      textarea.scrollTop = Math.max(0, selectionTop - textarea.clientHeight / 3)
    }
    syncScroll(textarea)
  }

  function handleSourceChange(nextSource: string, selection: number) {
    const nextVersion = onSourceChange(nextSource)
    latestSourceRef.current = nextSource
    latestVersionRef.current = nextVersion
    setCompletion(null)
    setHoverState(null)
    setIntelligenceErrorState(null)
    requestCompletion(nextSource, nextVersion, selection, 80)
    requestHover(nextSource, nextVersion, selection, 140)
  }

  function handleSelection(selection: number, delay = 80) {
    if (
      selection !== completionSelectionRef.current ||
      textareaRef.current?.selectionEnd !== selection
    ) {
      completionRequestRef.current += 1
      setCompletion(null)
    }
    requestHover(latestSourceRef.current, latestVersionRef.current, selection, delay)
  }

  function acceptCompletion(item: CompletionItem) {
    const edited = applyTextEdit(latestSourceRef.current, item.edit)
    const nextVersion = onSourceChange(edited.source)
    latestSourceRef.current = edited.source
    latestVersionRef.current = nextVersion
    pendingSelectionRef.current = {
      documentVersion: nextVersion,
      index: edited.selection,
      source: edited.source,
    }
    setCompletion(null)
    setHoverState(null)
    setIntelligenceErrorState(null)
  }

  function handlePointerMove(event: React.PointerEvent<HTMLTextAreaElement>) {
    if (event.pointerType === "touch") return
    const textarea = event.currentTarget
    characterWidthRef.current ??= measureCharacterWidth(
      getComputedStyle(textarea).font,
      Number.parseFloat(getComputedStyle(textarea).fontSize) || 13,
    )
    const index = sourceIndexAtPointer(
      textarea,
      source,
      event.clientX,
      event.clientY,
      characterWidthRef.current,
    )
    requestHover(source, documentVersion, index, 180)
  }

  const highlightedLines =
    highlighted?.source === source && highlighted.colorMode === colorMode ? highlighted.lines : null
  const showHighlighting = highlightedLines !== null && !isComposing
  const hasCompletions = completionItems.length > 0
  const activeOptionId = hasCompletions
    ? `${completionListId}-option-${activeCompletion}`
    : undefined

  return (
    <section className="grid h-[38rem] grid-rows-[auto_1fr_auto_auto] bg-background lg:h-auto lg:min-h-0">
      <div className="flex min-h-12 flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
        <div className="flex items-baseline gap-2">
          <h2 className="text-sm font-medium">Source</h2>
          <span className="font-mono text-[0.6875rem] text-muted-foreground">main.stack</span>
        </div>

        <fieldset className="flex min-w-0 items-center gap-1.5 border-0 p-0">
          <legend className="sr-only">Source actions</legend>
          <Button disabled={disabled} onClick={onFormat} size="sm" variant="outline">
            <Braces aria-hidden="true" data-icon="inline-start" />
            Format
          </Button>
          <Button disabled={disabled} onClick={onCheck} size="sm" variant="outline">
            <CircleCheck aria-hidden="true" data-icon="inline-start" />
            Check
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button disabled={disabled} onClick={onRender} size="sm">
                <Play aria-hidden="true" data-icon="inline-start" fill="currentColor" />
                Run
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Run with ⌘ Enter or Ctrl Enter</TooltipContent>
          </Tooltip>
        </fieldset>
      </div>

      <div className="flex min-h-0 overflow-hidden bg-editor focus-within:ring-1 focus-within:ring-inset focus-within:ring-ring">
        <div
          aria-hidden="true"
          className="w-11 shrink-0 overflow-hidden border-r py-4 text-right font-mono text-xs leading-[1.65rem] text-editor-muted select-none"
          ref={gutterRef}
        >
          {lineNumbers.map((line) => (
            <span
              className={cn(
                "block h-[1.65rem] border-r-2 pr-2.5",
                diagnosticGutterLines.get(line) === "error" &&
                  "border-destructive bg-destructive/10 font-medium text-destructive",
                diagnosticGutterLines.get(line) === "warning" &&
                  "border-foreground bg-foreground/10 font-medium text-foreground",
                !diagnosticGutterLines.has(line) && "border-transparent",
              )}
              key={line}
            >
              {line}
            </span>
          ))}
        </div>

        <div className="relative min-w-0 flex-1">
          <HighlightLayer
            highlightRef={highlightRef}
            isVisible={showHighlighting}
            lines={highlightedLines}
          />
          <DiagnosticLayer
            diagnostics={diagnostics}
            layerRef={diagnosticLayerRef}
            source={source}
          />

          <textarea
            aria-activedescendant={activeOptionId}
            aria-autocomplete="list"
            aria-controls={hasCompletions ? completionListId : undefined}
            aria-describedby={`diagnostics-heading ${contextId} ${intelligenceStatusId}`}
            aria-haspopup="listbox"
            aria-keyshortcuts="Control+Space Meta+Enter Control+Enter"
            aria-label="Stack source"
            className={cn(
              "absolute inset-0 z-20 size-full resize-none overflow-auto bg-transparent p-4 font-mono text-[0.8125rem] leading-[1.65rem] outline-none placeholder:text-muted-foreground",
              showHighlighting
                ? "stack-editor-input-highlighted text-transparent caret-foreground"
                : "text-foreground",
            )}
            disabled={disabled}
            id="stack-source"
            name="source"
            onBlur={() => {
              focusedRef.current = false
              completionRequestRef.current += 1
              setCompletion(null)
            }}
            onChange={(event) =>
              handleSourceChange(event.target.value, event.target.selectionStart)
            }
            onClick={(event) => handleSelection(event.currentTarget.selectionStart)}
            onCompositionEnd={(event) => {
              composingRef.current = false
              setIsComposing(false)
              requestCompletion(
                event.currentTarget.value,
                latestVersionRef.current,
                event.currentTarget.selectionStart,
                0,
              )
            }}
            onCompositionStart={() => {
              composingRef.current = true
              completionRequestRef.current += 1
              hoverRequestRef.current += 1
              setIsComposing(true)
              setCompletion(null)
            }}
            onFocus={(event) => {
              focusedRef.current = true
              handleSelection(event.currentTarget.selectionStart, 0)
            }}
            onKeyDown={(event) => {
              if (composingRef.current || event.nativeEvent.isComposing) return
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                event.preventDefault()
                setCompletion(null)
                onRender()
                return
              }
              if (event.key === " " && event.ctrlKey) {
                event.preventDefault()
                requestCompletion(source, documentVersion, event.currentTarget.selectionStart, 0)
                return
              }
              if (!hasCompletions) return
              if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault()
                const direction = event.key === "ArrowDown" ? 1 : -1
                setActiveCompletion(
                  (current) =>
                    (current + direction + completionItems.length) % completionItems.length,
                )
                return
              }
              if (event.key === "Enter" || event.key === "Tab") {
                event.preventDefault()
                acceptCompletion(completionItems[activeCompletion])
                return
              }
              if (event.key === "Escape") {
                event.preventDefault()
                completionRequestRef.current += 1
                setCompletion(null)
              }
            }}
            onKeyUp={(event) => {
              if (!event.metaKey && !event.ctrlKey && !event.altKey) {
                handleSelection(event.currentTarget.selectionStart)
              }
            }}
            onPointerMove={handlePointerMove}
            onScroll={(event) => syncScroll(event.currentTarget)}
            onSelect={(event) => handleSelection(event.currentTarget.selectionStart)}
            ref={textareaRef}
            spellCheck={false}
            value={source}
            wrap="off"
          />

          {hasCompletions ? (
            <div
              aria-label="Stack suggestions"
              className="absolute right-2 bottom-2 left-2 z-30 max-h-64 overflow-auto border bg-popover text-popover-foreground shadow-lg sm:right-auto sm:w-[24rem]"
              id={completionListId}
              role="listbox"
            >
              {completionItems.map((item, index) => (
                <button
                  aria-selected={activeCompletion === index}
                  className="grid w-full grid-cols-[1fr_auto] gap-x-3 border-b px-3 py-2 text-left text-xs outline-none last:border-b-0 hover:bg-accent aria-selected:bg-accent"
                  id={`${completionListId}-option-${index}`}
                  key={`${item.kind}-${item.label}-${index}`}
                  onClick={() => acceptCompletion(item)}
                  onMouseDown={(event) => event.preventDefault()}
                  role="option"
                  tabIndex={-1}
                  type="button"
                >
                  <span className="min-w-0">
                    <code className="block truncate font-mono font-medium">{item.label}</code>
                    {item.detail ? (
                      <span className="mt-0.5 block truncate text-muted-foreground">
                        {item.detail}
                      </span>
                    ) : null}
                    {item.documentation ? (
                      <span className="mt-1 block text-pretty text-muted-foreground">
                        {item.documentation}
                      </span>
                    ) : null}
                  </span>
                  <span className="font-mono text-[0.625rem] uppercase text-muted-foreground">
                    {item.kind}
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div
        aria-live="polite"
        className="flex min-h-10 items-center gap-2 border-t bg-background px-3 py-2 text-xs"
        id={contextId}
      >
        <span className="shrink-0 font-medium">Context</span>
        {intelligenceError ? (
          <span className="text-destructive">Language help unavailable: {intelligenceError}</span>
        ) : hover ? (
          <span className="min-w-0 truncate text-muted-foreground">
            <span className="mr-2 font-mono text-[0.625rem] uppercase">{hover.kind}</span>
            <span className="font-medium text-foreground">{hover.label}</span>
            {hover.detail ? ` — ${hover.detail}` : ""}
            {hover.documentation ? ` · ${hover.documentation}` : ""}
          </span>
        ) : (
          <span className="text-muted-foreground">Point to or move the caret into a symbol.</span>
        )}
      </div>

      <p className="sr-only" id={intelligenceStatusId} aria-live="polite">
        {hasCompletions
          ? `${completionItems.length} suggestion${completionItems.length === 1 ? "" : "s"} available.`
          : ""}
      </p>

      <Diagnostics diagnostics={diagnostics} onSelectRange={selectRange} source={source} />
    </section>
  )
}

function sourceIndexAtPointer(
  textarea: HTMLTextAreaElement,
  source: string,
  clientX: number,
  clientY: number,
  characterWidth: number,
) {
  const style = getComputedStyle(textarea)
  const lineHeight = Number.parseFloat(style.lineHeight) || 26.4
  const rect = textarea.getBoundingClientRect()
  const x = clientX - rect.left + textarea.scrollLeft - (Number.parseFloat(style.paddingLeft) || 0)
  const y = clientY - rect.top + textarea.scrollTop - (Number.parseFloat(style.paddingTop) || 0)
  const lines = source.split("\n")
  const lineIndex = Math.min(Math.max(Math.floor(y / lineHeight), 0), lines.length - 1)
  const column = Math.min(Math.max(Math.round(x / characterWidth), 0), lines[lineIndex].length)
  let index = 0
  for (let line = 0; line < lineIndex; line += 1) index += lines[line].length + 1
  return index + column
}

function measureCharacterWidth(font: string, fontSize: number) {
  const probe = document.createElement("span")
  probe.style.cssText = `position:fixed;visibility:hidden;white-space:pre;font:${font}`
  probe.textContent = "M"
  document.body.append(probe)
  const width = probe.getBoundingClientRect().width
  probe.remove()
  return width || fontSize * 0.6
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "The Stack engine could not analyze this source."
}
