import init, {
  check,
  checkWithProviderPacks,
  completion,
  completionWithProviderPacks,
  format,
  hover,
  render,
  renderWithProviderPacks,
  type CheckResult,
  type CompletionResult,
  type FormatResult,
  type HoverResult,
  type ProviderPackInput,
  type RenderResult,
  type SourcePosition,
} from "@stack-sh/engine"

let initialization: Promise<void> | undefined

export function initializeStackEngine(): Promise<void> {
  initialization ??= init()
    .then(() => undefined)
    .catch((error) => {
      initialization = undefined
      throw error
    })
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

export function completeStack(
  source: string,
  documentVersion: number,
  position: SourcePosition,
  providerPacks: readonly ProviderPackInput[] = [],
): CompletionResult {
  return providerPacks.length > 0
    ? completionWithProviderPacks(source, documentVersion, position, providerPacks)
    : completion(source, documentVersion, position)
}

export function hoverStack(
  source: string,
  documentVersion: number,
  position: SourcePosition,
): HoverResult {
  return hover(source, documentVersion, position)
}

export function validateProviderPack(providerPack: ProviderPackInput): void {
  checkWithProviderPacks('stack 1.0\ndiagram "Provider pack validation" {}\n', [providerPack])
}
