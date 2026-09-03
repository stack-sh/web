import { useMemo, useRef } from "react"
import { Braces, CircleCheck, Play } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

import { Diagnostics } from "./diagnostics"
import type { Diagnostic } from "@stack-sh/engine"

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
  const gutterRef = useRef<HTMLPreElement>(null)
  const lineNumbers = useMemo(
    () => Array.from({ length: source.split("\n").length }, (_, index) => index + 1).join("\n"),
    [source],
  )

  return (
    <section className="grid min-h-[38rem] grid-rows-[auto_1fr_auto] bg-white lg:min-h-0">
      <div className="flex min-h-12 flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
        <div className="flex items-baseline gap-2">
          <h2 className="text-sm font-medium">Source</h2>
          <span className="font-mono text-[0.6875rem] text-muted-foreground">main.stack</span>
        </div>

        <div aria-label="Source actions" className="flex items-center gap-1.5">
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
        </div>
      </div>

      <div className="flex min-h-0 overflow-hidden bg-[#fbfbfb]">
        <pre
          aria-hidden="true"
          className="w-11 shrink-0 overflow-hidden border-r py-4 pr-3 text-right font-mono text-xs leading-[1.65rem] text-[#a3a3a3] select-none"
          ref={gutterRef}
        >
          {lineNumbers}
        </pre>
        <textarea
          aria-label="Stack source"
          className="min-h-0 flex-1 resize-none overflow-auto bg-transparent p-4 font-mono text-[0.8125rem] leading-[1.65rem] text-foreground outline-none placeholder:text-muted-foreground focus-visible:bg-white"
          onChange={(event) => onSourceChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
              event.preventDefault()
              onRender()
            }
          }}
          onScroll={(event) => {
            if (gutterRef.current) {
              gutterRef.current.scrollTop = event.currentTarget.scrollTop
            }
          }}
          spellCheck={false}
          value={source}
          wrap="off"
        />
      </div>

      <Diagnostics diagnostics={diagnostics} />
    </section>
  )
}
