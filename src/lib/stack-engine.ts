import init, {
  check,
  checkWithProviderPacks,
  format,
  render,
  renderWithProviderPacks,
  type CheckResult,
  type FormatResult,
  type ProviderPackInput,
  type RenderResult,
} from "@stack-sh/engine"

let initialization: Promise<void> | undefined

export function initializeStackEngine(): Promise<void> {
  initialization ??= init().then(() => undefined)
  return initialization
}

export function checkStack(
  source: string,
  providerPacks: readonly ProviderPackInput[] = [],
): CheckResult {
  return providerPacks.length > 0 ? checkWithProviderPacks(source, providerPacks) : check(source)
}

export function formatStack(source: string): FormatResult {
  return format(source)
}

export function renderStack(
  source: string,
  providerPacks: readonly ProviderPackInput[] = [],
): RenderResult {
  return providerPacks.length > 0 ? renderWithProviderPacks(source, providerPacks) : render(source)
}

export function validateProviderPack(providerPack: ProviderPackInput): void {
  checkWithProviderPacks('stack 1.0\ndiagram "Provider pack validation" {}\n', [providerPack])
}
