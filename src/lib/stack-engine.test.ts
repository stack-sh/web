import { expect, it, vi } from "vitest"
import init from "@stack-sh/engine"
import { initializeStackEngine } from "./stack-engine"

vi.mock("@stack-sh/engine", () => ({ default: vi.fn() }))

it("shares WASM initialization and permits a fresh attempt after failure", async () => {
  vi.mocked(init).mockRejectedValueOnce(new Error("offline"))
  const first = initializeStackEngine()
  expect(initializeStackEngine()).toBe(first)
  await expect(first).rejects.toThrow("offline")
  vi.mocked(init).mockResolvedValueOnce({} as Awaited<ReturnType<typeof init>>)
  const retry = initializeStackEngine()
  expect(retry).not.toBe(first)
  await retry
  expect(initializeStackEngine()).toBe(retry)
  expect(init).toHaveBeenCalledTimes(2)
})
