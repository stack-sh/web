import { describe, expect, it } from "vitest"

import {
  applyTextEdit,
  sourceCodeFrame,
  sourcePositionAtUtf16Index,
  sourceSelection,
  utf8ByteOffsetToUtf16Index,
} from "./source-position"

describe("source positions", () => {
  it("converts UTF-8 byte offsets to JavaScript UTF-16 indices", () => {
    const source = 'node café "😀"\nlayout { direction hoo }'
    const start = new TextEncoder().encode(source.slice(0, source.indexOf("hoo"))).length
    const end = start + new TextEncoder().encode("hoo").length
    const range = {
      end: { byteOffset: end, column: 23, line: 2 },
      start: { byteOffset: start, column: 20, line: 2 },
    }

    expect(utf8ByteOffsetToUtf16Index(source, start)).toBe(source.indexOf("hoo"))
    expect(sourceSelection(source, range)).toEqual({
      start: source.indexOf("hoo"),
      end: source.indexOf("hoo") + 3,
    })
    expect(sourceCodeFrame(source, range)).toEqual({
      line: 2,
      before: "layout { direction ",
      marked: "hoo",
      after: " }",
    })
  })

  it("converts JavaScript carets to portable UTF-8 positions", () => {
    const source = 'node café "😀"\r\n  icon "api"'
    const caret = source.indexOf("api") + 2

    expect(sourcePositionAtUtf16Index(source, caret)).toEqual({
      byteOffset: new TextEncoder().encode(source.slice(0, caret)).length,
      line: 2,
      column: 11,
    })
    expect(sourcePositionAtUtf16Index(source, source.indexOf("\n"))).toEqual(
      sourcePositionAtUtf16Index(source, source.indexOf("\r")),
    )
  })

  it("applies engine text edits without treating UTF-8 offsets as UTF-16 indices", () => {
    const source = 'node café "😀" { icon "ga" }'
    const start = new TextEncoder().encode(source.slice(0, source.indexOf("ga"))).length
    const end = start + 2

    expect(
      applyTextEdit(source, {
        newText: "gateway",
        range: {
          end: { byteOffset: end, column: 0, line: 1 },
          start: { byteOffset: start, column: 0, line: 1 },
        },
      }),
    ).toEqual({
      source: 'node café "😀" { icon "gateway" }',
      selection: source.indexOf("ga") + "gateway".length,
    })
  })
})
