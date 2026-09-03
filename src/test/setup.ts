import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterEach, vi } from "vitest"

afterEach(cleanup)

class ResizeObserverMock {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

vi.stubGlobal("ResizeObserver", ResizeObserverMock)

Object.defineProperty(URL, "createObjectURL", {
  configurable: true,
  value: vi.fn(() => "blob:stack-preview"),
})

Object.defineProperty(URL, "revokeObjectURL", {
  configurable: true,
  value: vi.fn(),
})
