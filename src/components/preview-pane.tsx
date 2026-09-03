import { useEffect, useMemo } from "react"
import { Download } from "lucide-react"

import { Button } from "@/components/ui/button"
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
      <div className="flex h-12 items-center justify-between border-b bg-white px-3">
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

      <div className="flex h-9 items-center justify-between border-t bg-white px-3 font-mono text-[0.6875rem] text-muted-foreground">
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
    <div className="flex max-h-full max-w-full items-center justify-center border bg-white p-2">
      <img
        alt="Rendered Stack architecture diagram"
        className="max-h-full max-w-full object-contain"
        src={previewUrl}
      />
    </div>
  )
}
