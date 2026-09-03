import type { CSSProperties, RefObject } from "react"
import type { ThemedToken } from "@shikijs/core"

interface HighlightLayerProps {
  highlightRef: RefObject<HTMLPreElement | null>
  isVisible: boolean
  lines: readonly (readonly ThemedToken[])[] | null
}

export function HighlightLayer({ highlightRef, isVisible, lines }: HighlightLayerProps) {
  return (
    <pre
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 m-0 overflow-hidden p-4 font-mono text-[0.8125rem] leading-[1.65rem] whitespace-pre ${isVisible ? "" : "invisible"}`}
      ref={highlightRef}
    >
      <code>
        {lines?.map((tokens, line) => (
          <span className="block h-[1.65rem]" key={line}>
            {tokens.length === 0 ? "\u200b" : null}
            {tokens.map((token, index) => (
              <span key={`${token.offset}-${index}`} style={tokenStyle(token)}>
                {token.content}
              </span>
            ))}
          </span>
        ))}
      </code>
    </pre>
  )
}

function tokenStyle(token: ThemedToken): CSSProperties {
  const fontStyle = token.fontStyle && token.fontStyle > 0 ? token.fontStyle : 0
  return {
    color: token.color,
    fontStyle: fontStyle & 1 ? "italic" : undefined,
    fontWeight: fontStyle & 2 ? 600 : undefined,
    textDecoration: fontStyle & 4 ? "underline" : undefined,
  }
}
