import { beforeEach, describe, expect, it, vi } from "vitest"
import corpus from "../../example-corpus/catalog.json"
import { EXAMPLE_SOURCE } from "./example"
import { renderExample } from "./render-example"
import { initializeStackEngine, renderStack } from "./stack-engine"

vi.mock("./stack-engine", () => ({
  initializeStackEngine: vi.fn().mockResolvedValue(undefined),
  renderStack: vi.fn().mockReturnValue({ svg: "<svg/>", diagnostics: [] }),
}))

beforeEach(() => vi.mocked(initializeStackEngine).mockResolvedValue(undefined))

describe("canonical runtime examples", () => {
  it("renders every catalog source through the shared Playground adapter", async () => {
    for (const example of corpus.examples) {
      await renderExample(example.source)
      expect(renderStack).toHaveBeenLastCalledWith(expect.stringContaining("stack 1.0"))
    }
    expect(initializeStackEngine).toHaveBeenCalledTimes(corpus.examples.length)
    await renderExample("04-commerce-platform.stack")
    expect(renderStack).toHaveBeenLastCalledWith(EXAMPLE_SOURCE)
  })

  it("rejects unknown paths without fetching or initializing the engine", async () => {
    await expect(renderExample("../../private.stack")).rejects.toThrow("Unknown canonical example")
    expect(initializeStackEngine).not.toHaveBeenCalled()
  })

  it("can retry after a failed engine load", async () => {
    vi.mocked(initializeStackEngine).mockRejectedValueOnce(new Error("offline"))
    await expect(renderExample("04-commerce-platform.stack")).rejects.toThrow("offline")
    expect(renderStack).not.toHaveBeenCalled()
    await renderExample("04-commerce-platform.stack")
    expect(renderStack).toHaveBeenCalledOnce()
  })
})
