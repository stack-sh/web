import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Braces, CircleCheck, Play } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { highlightStack } from "@/lib/highlight-stack"
import { sourceSelection } from "@/lib/source-position"
import { cn } from "@/lib/utils"

import { Diagnostics } from "./diagnostics"
import { HighlightLayer } from "./highlight-layer"
import type { Diagnostic, SourceRange } from "@stack-sh/engine"

interface EditorPaneProps {
  source: string
  diagnostics: readonly Diagnostic[]
  disabled: boolean
  onSourceChange: (source: string) => void
  onFormat: () => void
  onCheck: () => void
  onRender: () => void
}

export function EditorPane({
  source,
  diagnostics,
  disabled,
  onSourceChange,
  onFormat,
  onCheck,
  onRender,
}: EditorPaneProps) {
  const gutterRef = useRef<HTMLDivElement>(null)
  const highlightRef = useRef<HTMLPreElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [highlighted, setHighlighted] = useState<{
    source: string
    lines: Awaited<ReturnType<typeof highlightStack>>
  } | null>(null)
  const [isComposing, setIsComposing] = useState(false)
  const lineNumbers = useMemo(
    () => Array.from({ length: source.split("\n").length }, (_, index) => index + 1),
    [source],
  )
  const diagnosticLines = useMemo(() => {
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
    highlightStack(source)
      .then((lines) => {
        if (active) setHighlighted({ source, lines })
      })
      .catch(() => {
        if (active) setHighlighted(null)
      })
    return () => {
      active = false
    }
  }, [source])

  const syncScroll = useCallback((textarea: HTMLTextAreaElement) => {
    if (gutterRef.current) gutterRef.current.scrollTop = textarea.scrollTop
    if (highlightRef.current) {
      highlightRef.current.scrollTop = textarea.scrollTop
      highlightRef.current.scrollLeft = textarea.scrollLeft
    }
  }, [])

  function selectRange(range: SourceRange) {
    const textarea = textareaRef.current
    if (!textarea) return

    const selection = sourceSelection(source, range)
    textarea.focus()
    textarea.setSelectionRange(selection.start, selection.end)

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

  const highlightedLines = highlighted?.source === source ? highlighted.lines : null
  const showHighlighting = highlightedLines !== null && !isComposing

  return (
    <section className="grid h-[38rem] grid-rows-[auto_1fr_auto] bg-white lg:h-auto lg:min-h-0">
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

      <div className="flex min-h-0 overflow-hidden bg-[#fbfbfb] focus-within:ring-1 focus-within:ring-inset focus-within:ring-ring">
        <div
          aria-hidden="true"
          className="w-11 shrink-0 overflow-hidden border-r py-4 text-right font-mono text-xs leading-[1.65rem] text-[#737373] select-none"
          ref={gutterRef}
        >
          {lineNumbers.map((line) => (
            <span
              className={cn(
                "block h-[1.65rem] border-r-2 pr-2.5",
                diagnosticLines.get(line) === "error" &&
                  "border-destructive bg-red-50 font-medium text-destructive",
                diagnosticLines.get(line) === "warning" &&
                  "border-foreground bg-neutral-100 font-medium text-foreground",
                !diagnosticLines.has(line) && "border-transparent",
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

          <textarea
            aria-describedby="diagnostics-heading"
            aria-label="Stack source"
            className={cn(
              "absolute inset-0 size-full resize-none overflow-auto bg-transparent p-4 font-mono text-[0.8125rem] leading-[1.65rem] outline-none placeholder:text-muted-foreground",
              showHighlighting
                ? "stack-editor-input-highlighted text-transparent caret-foreground"
                : "text-foreground",
            )}
            onChange={(event) => onSourceChange(event.target.value)}
            onCompositionEnd={() => setIsComposing(false)}
            onCompositionStart={() => setIsComposing(true)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                event.preventDefault()
                onRender()
              }
            }}
            onScroll={(event) => syncScroll(event.currentTarget)}
            ref={textareaRef}
            spellCheck={false}
            value={source}
            wrap="off"
          />
        </div>
      </div>

      <Diagnostics diagnostics={diagnostics} onSelectRange={selectRange} source={source} />
    </section>
  )
}
