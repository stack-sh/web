import { describe, expect, it } from "vitest"

import { sourceCodeFrame, sourceSelection, utf8ByteOffsetToUtf16Index } from "./source-position"

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
})
