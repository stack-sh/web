import assert from "node:assert/strict"
import test from "node:test"
import { createImageDialog } from "./image-dialog.mjs"

function fixture() {
  const dialog = new EventTarget()
  const style = { overflow: "auto" }
  dialog.ownerDocument = { documentElement: { style } }
  dialog.open = false
  dialog.showModal = () => {
    dialog.open = true
  }
  dialog.close = () => {
    dialog.open = false
    dialog.dispatchEvent(new Event("close"))
  }
  let resets = 0
  const controller = createImageDialog(dialog, () => {
    resets += 1
  })
  return { dialog, style, controller, resets: () => resets }
}

test("opening locks the page and closing restores its previous overflow", () => {
  const f = fixture()
  f.controller.open()
  assert.equal(f.dialog.open, true)
  assert.equal(f.style.overflow, "hidden")
  f.controller.close()
  assert.equal(f.style.overflow, "auto")
  assert.equal(f.resets(), 1)
})

test("repeated open cannot lose the original scroll state", () => {
  const f = fixture()
  f.controller.open()
  f.controller.open()
  f.controller.close()
  assert.equal(f.style.overflow, "auto")
})

test("native Escape dismissal restores scrolling and resets image sizing", () => {
  const f = fixture()
  f.controller.open()
  f.dialog.close()
  assert.equal(f.style.overflow, "auto")
  assert.equal(f.resets(), 1)
})

test("unmounting an open dialog restores scrolling and removes listeners", () => {
  const f = fixture()
  f.controller.open()
  f.controller.dispose()
  assert.equal(f.dialog.open, false)
  assert.equal(f.style.overflow, "auto")
  const resets = f.resets()
  f.dialog.dispatchEvent(new Event("close"))
  assert.equal(f.resets(), resets)
})

test("failed modal activation never locks the page", () => {
  const f = fixture()
  f.dialog.showModal = () => {
    throw new Error("detached dialog")
  }
  assert.throws(() => f.controller.open(), /detached/)
  assert.equal(f.style.overflow, "auto")
})

test("a delayed close event cannot unlock a reopened dialog", () => {
  const f = fixture()
  f.controller.open()
  f.dialog.dispatchEvent(new Event("close"))
  assert.equal(f.style.overflow, "hidden")
  assert.equal(f.resets(), 0)
  f.controller.dispose()
})
