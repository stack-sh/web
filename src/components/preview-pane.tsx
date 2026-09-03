import { useEffect, useMemo } from "react"
import { Download, Maximize2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface PreviewPaneProps {
  svg: string | null
  status: string
  engineVersion: string | null
  isLoading: boolean
}

export function PreviewPane({ svg, status, engineVersion, isLoading }: PreviewPaneProps) {
  function downloadSvg() {
    if (!svg) return

    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }))
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = "diagram.svg"
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="grid min-h-[34rem] grid-rows-[auto_1fr_auto] border-t bg-muted lg:min-h-0 lg:border-t-0 lg:border-l">
      <div className="flex h-12 items-center justify-between border-b bg-background px-3">
        <h2 className="text-sm font-medium">Preview</h2>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-label="Download SVG"
              disabled={!svg}
              onClick={downloadSvg}
              size="icon-sm"
              variant="ghost"
            >
              <Download aria-hidden="true" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Download SVG</TooltipContent>
        </Tooltip>
      </div>

      <div className="flex min-h-0 items-center justify-center overflow-auto p-4 sm:p-6">
        {svg ? (
          <SvgImage svg={svg} />
        ) : (
          <p className="max-w-xs text-center text-sm leading-6 text-muted-foreground">
            {isLoading ? "Loading the Stack engine…" : "Run the source to generate an SVG."}
          </p>
        )}
      </div>

      <div className="flex h-9 items-center justify-between border-t bg-background px-3 font-mono text-[0.6875rem] text-muted-foreground">
        <span aria-live="polite">{status}</span>
        <span>{engineVersion ? `engine ${engineVersion}` : "engine —"}</span>
      </div>
    </section>
  )
}

function SvgImage({ svg }: { svg: string }) {
  const previewUrl = useMemo(
    () => URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" })),
    [svg],
  )

  useEffect(() => () => URL.revokeObjectURL(previewUrl), [previewUrl])

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          aria-label="Expand rendered diagram"
          className="group relative flex max-h-full max-w-full items-center justify-center border bg-white p-2 outline-none transition-colors hover:border-foreground/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-muted"
          type="button"
        >
          <img
            alt="Rendered Stack architecture diagram"
            className="max-h-full max-w-full object-contain"
            src={previewUrl}
          />
          <span className="absolute right-2 bottom-2 inline-flex items-center gap-1 border bg-white/95 px-2 py-1 font-sans text-[0.6875rem] font-medium text-neutral-900 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            <Maximize2 aria-hidden="true" className="size-3" />
            Expand
          </span>
        </button>
      </DialogTrigger>
      <DialogContent className="h-[calc(100svh-2rem)] max-w-[calc(100%-2rem)] grid-rows-[auto_1fr] gap-0 overflow-hidden p-0 sm:max-w-[calc(100%-2rem)]">
        <DialogHeader className="border-b px-4 py-3 pr-12">
          <DialogTitle>Rendered diagram</DialogTitle>
          <DialogDescription>
            Expanded SVG preview. Scroll to inspect the full diagram.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 overflow-auto bg-muted p-4 sm:p-8">
          <div className="flex min-h-full min-w-[48rem] items-start justify-center">
            <img
              alt="Expanded Stack architecture diagram"
              className="h-auto w-full max-w-none border bg-white p-2 object-contain"
              src={previewUrl}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
