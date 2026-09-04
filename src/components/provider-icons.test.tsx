import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { ProviderIcons } from "./provider-icons"
import type { LoadedProviderPack } from "@/lib/provider-pack"

function providerPack(): LoadedProviderPack {
  return {
    input: { manifest: {}, assets: [] },
    providerId: "azure",
    providerName: "Microsoft Azure",
    packVersion: "0.2.0",
    sources: [
      {
        id: "primary",
        pageUrl: "https://example.com/icons",
        release: "fixture",
        termsUrl: "https://example.com/terms",
        reviewAfter: "2026-12-03",
      },
      {
        id: "categories",
        pageUrl: "https://example.com/categories",
        release: "fixture-categories",
        termsUrl: "https://example.com/category-terms",
        reviewAfter: "2026-12-04",
      },
    ],
    icons: Array.from({ length: 50 }, (_, index) => ({
      id: `azure:service-${index + 1}`,
      productName: index === 49 ? "Needle Database" : `Azure Service ${index + 1}`,
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"/>',
    })),
  }
}

describe("ProviderIcons", () => {
  it("searches large local packs and reveals results in bounded batches", async () => {
    const user = userEvent.setup()
    render(
      <ProviderIcons
        disabled={false}
        onImport={vi.fn()}
        onRemove={vi.fn()}
        packs={[providerPack()]}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Provider icons" }))
    expect(screen.getByText("primary")).toBeInTheDocument()
    expect(screen.getByText("categories")).toBeInTheDocument()
    expect(screen.getAllByRole("link", { name: "Source" })).toHaveLength(2)
    expect(screen.getAllByRole("link", { name: "Terms" })).toHaveLength(2)
    expect(screen.getByText("azure:service-48")).toBeInTheDocument()
    expect(screen.queryByText("azure:service-49")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Show 2 more" }))
    expect(screen.getByText("azure:service-50")).toBeInTheDocument()

    await user.type(screen.getByRole("searchbox"), "needle")
    expect(screen.getByText("Needle Database")).toBeInTheDocument()
    expect(screen.queryByText("Azure Service 1")).not.toBeInTheDocument()
    expect(screen.getByText("1 result")).toBeInTheDocument()
  })
})
