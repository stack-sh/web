import { createHighlighterCore } from "@shikijs/core"
import { createJavaScriptRegexEngine } from "@shikijs/engine-javascript"
import stackGrammar from "@stack-sh/language/grammar"
import type { LanguageRegistration, ThemedToken, ThemeRegistration } from "@shikijs/core"

import type { ColorMode } from "./color-mode"

export const STACK_SYNTAX_PALETTES = {
  light: {
    background: "#f6f8fa",
    foreground: "#24292f",
    declaration: "#cf222e",
    property: "#8250df",
    operator: "#0550ae",
    string: "#0a3069",
    value: "#116329",
    comment: "#57606a",
    number: "#953800",
    punctuation: "#57606a",
    invalid: "#cf222e",
  },
  dark: {
    background: "#0d1117",
    foreground: "#e6edf3",
    declaration: "#ff7b72",
    property: "#d2a8ff",
    operator: "#79c0ff",
    string: "#a5d6ff",
    value: "#7ee787",
    comment: "#8b949e",
    number: "#ffa657",
    punctuation: "#8b949e",
    invalid: "#ff7b72",
  },
} as const

const LIGHT = STACK_SYNTAX_PALETTES.light
const DARK = STACK_SYNTAX_PALETTES.dark

const STACK_LIGHT_THEME = {
  name: "stack-light",
  type: "light",
  bg: LIGHT.background,
  fg: LIGHT.foreground,
  settings: [
    { settings: { background: LIGHT.background, foreground: LIGHT.foreground } },
    {
      scope: ["keyword.control.declaration.stack"],
      settings: { foreground: LIGHT.declaration, fontStyle: "bold" },
    },
    {
      scope: ["keyword.other.property.stack"],
      settings: { foreground: LIGHT.property },
    },
    {
      scope: ["keyword.operator.edge.stack"],
      settings: { foreground: LIGHT.operator, fontStyle: "bold" },
    },
    {
      scope: ["string.quoted.double.stack"],
      settings: { foreground: LIGHT.string },
    },
    {
      scope: ["constant.character.escape.stack"],
      settings: { foreground: LIGHT.invalid, fontStyle: "bold" },
    },
    {
      scope: ["constant.language.stack"],
      settings: { foreground: LIGHT.value },
    },
    {
      scope: ["comment.line.double-slash.stack"],
      settings: { foreground: LIGHT.comment, fontStyle: "italic" },
    },
    {
      scope: ["constant.numeric.integer.stack"],
      settings: { foreground: LIGHT.number },
    },
    {
      scope: ["punctuation.stack"],
      settings: { foreground: LIGHT.punctuation },
    },
    {
      scope: ["invalid.illegal.escape.stack"],
      settings: { foreground: LIGHT.invalid, fontStyle: "underline" },
    },
  ],
} satisfies ThemeRegistration

const STACK_DARK_THEME = {
  name: "stack-dark",
  type: "dark",
  bg: DARK.background,
  fg: DARK.foreground,
  settings: [
    { settings: { background: DARK.background, foreground: DARK.foreground } },
    {
      scope: ["keyword.control.declaration.stack"],
      settings: { foreground: DARK.declaration, fontStyle: "bold" },
    },
    {
      scope: ["keyword.other.property.stack"],
      settings: { foreground: DARK.property },
    },
    {
      scope: ["keyword.operator.edge.stack"],
      settings: { foreground: DARK.operator, fontStyle: "bold" },
    },
    {
      scope: ["string.quoted.double.stack"],
      settings: { foreground: DARK.string },
    },
    {
      scope: ["constant.character.escape.stack"],
      settings: { foreground: DARK.invalid, fontStyle: "bold" },
    },
    {
      scope: ["constant.language.stack"],
      settings: { foreground: DARK.value },
    },
    {
      scope: ["comment.line.double-slash.stack"],
      settings: { foreground: DARK.comment, fontStyle: "italic" },
    },
    {
      scope: ["constant.numeric.integer.stack"],
      settings: { foreground: DARK.number },
    },
    {
      scope: ["punctuation.stack"],
      settings: { foreground: DARK.punctuation },
    },
    {
      scope: ["invalid.illegal.escape.stack"],
      settings: { foreground: DARK.invalid, fontStyle: "underline" },
    },
  ],
} satisfies ThemeRegistration

const highlighter = createHighlighterCore({
  engine: createJavaScriptRegexEngine(),
  langs: [stackGrammar as unknown as LanguageRegistration],
  themes: [STACK_LIGHT_THEME, STACK_DARK_THEME],
})

export async function highlightStack(
  source: string,
  colorMode: ColorMode,
): Promise<readonly (readonly ThemedToken[])[]> {
  return (await highlighter).codeToTokensBase(source, {
    lang: "stack",
    theme: colorMode === "dark" ? STACK_DARK_THEME.name : STACK_LIGHT_THEME.name,
    tokenizeMaxLineLength: 4_000,
    tokenizeTimeLimit: 100,
  })
}
