import type { RenderResult } from "@stack-sh/engine"
import { expect, it, vi } from "vitest"
import { createExamplePreview } from "./example-preview"

const result = {
  svg: '<svg xmlns="http://www.w3.org/2000/svg"/>',
  diagnostics: [],
} as unknown as RenderResult

it("renders into an isolated image and releases URLs on replacement and disposal", async () => {
  const update = vi.fn()
  const render = vi.fn().mockResolvedValue(result)
  const preview = createExamplePreview(render, update)
  await preview.load("first.stack")
  expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob))
  expect(update).toHaveBeenLastCalledWith({ status: "ready", result, url: "blob:stack-preview" })
  await preview.load("second.stack")
  expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1)
  preview.dispose()
  expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2)
  await preview.load("third.stack")
  expect(render).toHaveBeenCalledTimes(2)
})

it("drops an obsolete render after a source change", async () => {
  let finish!: (result: RenderResult) => void
  const update = vi.fn()
  const render = vi
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve
        }),
    )
    .mockResolvedValue(result)
  const preview = createExamplePreview(render, update)
  const pending = preview.load("old.stack")
  await preview.load("new.stack")
  finish(result)
  await pending
  expect(URL.createObjectURL).toHaveBeenCalledOnce()
  preview.dispose()
})

it("does not allocate or publish a late image after navigation", async () => {
  let finish!: (result: RenderResult) => void
  const update = vi.fn()
  const preview = createExamplePreview(
    () =>
      new Promise((resolve) => {
        finish = resolve
      }),
    update,
  )
  const pending = preview.load("example.stack")
  preview.dispose()
  finish(result)
  await pending
  expect(URL.createObjectURL).not.toHaveBeenCalled()
  expect(update).toHaveBeenCalledTimes(1)
})

it("keeps errors separate from operational failures and retains warning diagnostics", async () => {
  const update = vi.fn()
  const diagnosticFields = {
    range: {
      start: { byteOffset: 0, line: 1, column: 1 },
      end: { byteOffset: 1, line: 1, column: 2 },
    },
    expected: [],
    help: null,
    related: [],
  }
  const errors: RenderResult = {
    ...result,
    diagnostics: [
      { ...diagnosticFields, severity: "error", code: "STK1001", message: "Invalid source" },
    ],
  }
  const warnings: RenderResult = {
    ...result,
    diagnostics: [
      {
        ...diagnosticFields,
        severity: "warning",
        code: "STK5001",
        message: "Missing provider icon",
      },
    ],
  }
  const render = vi.fn().mockResolvedValueOnce(errors).mockResolvedValueOnce(warnings)
  const preview = createExamplePreview(render, update)
  await preview.load("example.stack")
  expect(update).toHaveBeenLastCalledWith({ status: "diagnostics", result: errors })
  expect(URL.createObjectURL).not.toHaveBeenCalled()
  await preview.load("example.stack")
  expect(update).toHaveBeenLastCalledWith({
    status: "ready",
    result: warnings,
    url: "blob:stack-preview",
  })
  preview.dispose()
})

it("offers a recoverable operational state for loading failures or missing SVG", async () => {
  const update = vi.fn()
  const render = vi
    .fn()
    .mockRejectedValueOnce(new Error("network"))
    .mockResolvedValueOnce({ ...result, svg: null })
    .mockResolvedValue(result)
  const preview = createExamplePreview(render, update)
  for (let attempt = 0; attempt < 2; attempt++) {
    await preview.load("example.stack")
    expect(update).toHaveBeenLastCalledWith({ status: "unavailable" })
  }
  await preview.load("example.stack")
  expect(update).toHaveBeenLastCalledWith({ status: "ready", result, url: "blob:stack-preview" })
  preview.dispose()
})
