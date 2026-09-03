export type ColorMode = "light" | "dark"

export const COLOR_MODE_STORAGE_KEY = "stack-color-mode"

function storedColorMode(): ColorMode | null {
  try {
    const value = localStorage.getItem(COLOR_MODE_STORAGE_KEY)
    return value === "light" || value === "dark" ? value : null
  } catch {
    return null
  }
}

export function initialColorMode(): ColorMode {
  const stored = storedColorMode()
  if (stored) return stored

  if (typeof document !== "undefined" && document.documentElement.classList.contains("dark")) {
    return "dark"
  }

  if (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark"
  }

  return "light"
}

export function saveColorMode(colorMode: ColorMode) {
  try {
    localStorage.setItem(COLOR_MODE_STORAGE_KEY, colorMode)
  } catch {
    // The selected mode still applies for this session when storage is unavailable.
  }
}

export function applyColorMode(colorMode: ColorMode) {
  document.documentElement.classList.toggle("dark", colorMode === "dark")
  document.documentElement.style.colorScheme = colorMode
}
