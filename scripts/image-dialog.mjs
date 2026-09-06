// Native dialog owns focus trapping, Escape, and focus restoration.
export function createImageDialog(dialog, reset) {
  const style = dialog.ownerDocument.documentElement.style
  let previousOverflow
  function release() {
    if (dialog.open) return
    if (previousOverflow !== undefined) {
      style.overflow = previousOverflow
      previousOverflow = undefined
      reset()
    }
  }
  dialog.addEventListener("close", release)
  return {
    open() {
      if (dialog.open) return
      dialog.showModal()
      previousOverflow ??= style.overflow
      style.overflow = "hidden"
    },
    close() {
      if (dialog.open) dialog.close()
      release()
    },
    dispose() {
      if (dialog.open) dialog.close()
      release()
      dialog.removeEventListener("close", release)
    },
  }
}
