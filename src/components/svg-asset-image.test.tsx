import { StrictMode } from "react"
import { render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { SvgAssetImage } from "./svg-asset-image"

describe("SvgAssetImage", () => {
  it("keeps the committed StrictMode URL alive", async () => {
    const activeUrls = new Set<string>()
    let sequence = 0
    vi.mocked(URL.createObjectURL).mockImplementation(() => {
      const url = `blob:strict-${sequence++}`
      activeUrls.add(url)
      return url
    })
    vi.mocked(URL.revokeObjectURL).mockImplementation((url) => activeUrls.delete(url))

    render(
      <StrictMode>
        <SvgAssetImage alt="Preview" svg="<svg />" />
      </StrictMode>,
    )

    const preview = screen.getByRole("img", { name: "Preview" })
    await waitFor(() => expect(preview).toHaveAttribute("src"))
    expect(activeUrls).toContain(preview.getAttribute("src"))
  })
})
