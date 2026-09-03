import init, {
  check,
  format,
  render,
  type CheckResult,
  type FormatResult,
  type RenderResult,
} from "@stack-sh/engine"

let initialization: Promise<void> | undefined

export function initializeStackEngine(): Promise<void> {
  initialization ??= init().then(() => undefined)
  return initialization
}

export function checkStack(source: string): CheckResult {
  return check(source)
}

export function formatStack(source: string): FormatResult {
  return format(source)
}

export function renderStack(source: string): RenderResult {
  return render(source)
}
