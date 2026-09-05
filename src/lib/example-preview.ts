import type { RenderResult } from "@stack-sh/engine"

export type ExamplePreviewState =
  | { status: "idle" | "loading" | "unavailable" }
  | { status: "diagnostics"; result: RenderResult }
  | { status: "ready"; result: RenderResult; url: string }

/** Own image URLs and discard late results after navigation or source changes. */
export function createExamplePreview(
  render: (filename: string) => Promise<RenderResult>,
  update: (state: ExamplePreviewState) => void,
) {
  let generation = 0
  let disposed = false
  let imageUrl: string | undefined

  function releaseImage() {
    if (imageUrl) URL.revokeObjectURL(imageUrl)
    imageUrl = undefined
  }

  return {
    async load(filename: string) {
      if (disposed) return
      const current = ++generation
      releaseImage()
      update({ status: "loading" })
      try {
        const result = await render(filename)
        if (disposed || current !== generation) return
        if (result.diagnostics.some((diagnostic) => diagnostic.severity === "error")) {
          update({ status: "diagnostics", result })
          return
        }
        if (!result.svg) throw new Error("Example did not produce an SVG")
        imageUrl = URL.createObjectURL(new Blob([result.svg], { type: "image/svg+xml" }))
        update({ status: "ready", result, url: imageUrl })
      } catch {
        if (!disposed && current === generation) update({ status: "unavailable" })
      }
    },
    dispose() {
      disposed = true
      generation++
      releaseImage()
    },
  }
}
