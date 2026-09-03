import { createHighlighterCore } from "@shikijs/core"
import { createJavaScriptRegexEngine } from "@shikijs/engine-javascript"
import stackGrammar from "@stack-sh/language/grammar"
import type { LanguageRegistration, ThemedToken, ThemeRegistration } from "@shikijs/core"

const STACK_THEME = {
  name: "stack-light",
  type: "light",
  bg: "#fbfbfb",
  fg: "#404040",
  settings: [
    { settings: { background: "#fbfbfb", foreground: "#404040" } },
    {
      scope: ["keyword.control.declaration.stack", "keyword.other.property.stack"],
      settings: { foreground: "#111111", fontStyle: "bold" },
    },
    {
      scope: ["keyword.operator.edge.stack"],
      settings: { foreground: "#111111", fontStyle: "bold" },
    },
    {
      scope: ["string.quoted.double.stack", "constant.language.stack"],
      settings: { foreground: "#525252" },
    },
    {
      scope: ["comment.line.double-slash.stack"],
      settings: { foreground: "#737373", fontStyle: "italic" },
    },
    {
      scope: ["constant.numeric.integer.stack", "punctuation.stack"],
      settings: { foreground: "#737373" },
    },
    {
      scope: ["invalid.illegal.escape.stack"],
      settings: { foreground: "#b42318", fontStyle: "underline" },
    },
  ],
} satisfies ThemeRegistration

const highlighter = createHighlighterCore({
  engine: createJavaScriptRegexEngine(),
  langs: [stackGrammar as unknown as LanguageRegistration],
  themes: [STACK_THEME],
})

export async function highlightStack(source: string): Promise<readonly (readonly ThemedToken[])[]> {
  return (await highlighter).codeToTokensBase(source, {
    lang: "stack",
    theme: STACK_THEME.name,
    tokenizeMaxLineLength: 4_000,
    tokenizeTimeLimit: 100,
  })
}
