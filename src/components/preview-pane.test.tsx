import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { PreviewPane } from "@/components/preview-pane"
import { TooltipProvider } from "@/components/ui/tooltip"

describe("PreviewPane", () => {
  it("keeps an oversized diagram reachable inside a keyboard-scrollable preview", () => {
    render(
      <TooltipProvider>
        <PreviewPane
          engineVersion="0.8.0"
          isLoading={false}
          providerNotices={[]}
          status="Render completed"
          svg={'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 2400" />'}
        />
      </TooltipProvider>,
    )

    const preview = screen.getByRole("region", { name: "Rendered diagram preview" })
    const trigger = screen.getByRole("button", { name: "Expand rendered diagram" })
    const image = screen.getByAltText("Rendered Stack architecture diagram")

    expect(preview).toHaveClass("overflow-auto")
    expect(trigger).toHaveAttribute("type", "button")
    expect(trigger).toHaveClass("m-auto", "shrink-0")
    expect(trigger).not.toHaveClass("max-h-full")
    expect(image).toHaveClass("h-auto", "max-w-full")
    expect(image).not.toHaveClass("max-h-full")
  })
})
