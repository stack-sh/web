import type { SourceRange } from "@stack-sh/engine"

export interface SourceSelection {
  start: number
  end: number
}

export interface SourceCodeFrame {
  line: number
  before: string
  marked: string
  after: string
}

function utf8Length(character: string) {
  const codePoint = character.codePointAt(0) ?? 0
  if (codePoint <= 0x7f) return 1
  if (codePoint <= 0x7ff) return 2
  if (codePoint <= 0xffff) return 3
  return 4
}

export function utf8ByteOffsetToUtf16Index(source: string, byteOffset: number) {
  const target = Math.max(0, byteOffset)
  let bytes = 0
  let index = 0

  for (const character of source) {
    const nextBytes = bytes + utf8Length(character)
    if (nextBytes > target) return index

    bytes = nextBytes
    index += character.length
    if (bytes === target) return index
  }

  return source.length
}

export function sourceSelection(source: string, range: SourceRange): SourceSelection {
  const start = utf8ByteOffsetToUtf16Index(source, range.start.byteOffset)
  const end = utf8ByteOffsetToUtf16Index(source, range.end.byteOffset)
  return { start, end: Math.max(start, end) }
}

export function sourceCodeFrame(source: string, range: SourceRange): SourceCodeFrame {
  const selection = sourceSelection(source, range)
  const lineStart = selection.start === 0 ? 0 : source.lastIndexOf("\n", selection.start - 1) + 1
  const nextLine = source.indexOf("\n", selection.start)
  const lineEnd = nextLine === -1 ? source.length : nextLine
  const markedEnd = Math.min(Math.max(selection.end, selection.start), lineEnd)

  return {
    line: range.start.line,
    before: source.slice(lineStart, selection.start),
    marked: source.slice(selection.start, markedEnd),
    after: source.slice(markedEnd, lineEnd).replace(/\r$/, ""),
  }
}
