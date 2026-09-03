import { readFile } from "node:fs/promises"
import path from "node:path"

const pages = [
  "index.md",
  "guide/what-is-stack.md",
  "guide/getting-started.md",
  "guide/playground.md",
  "language/syntax.md",
  "language/nodes-and-groups.md",
  "language/edges-and-layout.md",
  "language/themes-and-icons.md",
  "language/formatting.md",
  "reference/diagnostics-and-limits.md",
  "reference/versioning-and-safety.md",
]

const locales = ["ja", "zh", "ko"]
const docsRoot = path.resolve("docs")

function codeBlocks(source) {
  return [...source.matchAll(/```stack\n([\s\S]*?)```/g)].map((match) => match[1])
}

function headingCount(source) {
  return source.match(/^#{1,4}\s+/gm)?.length ?? 0
}

const englishPages = new Map()

for (const page of pages) {
  const source = await readFile(path.join(docsRoot, page), "utf8")
  englishPages.set(page, source)
}

for (const locale of locales) {
  for (const page of pages) {
    const english = englishPages.get(page)
    const translated = await readFile(path.join(docsRoot, locale, page), "utf8")

    if (headingCount(translated) !== headingCount(english)) {
      throw new Error(
        `${locale}/${page} does not have the same heading coverage as the English page`,
      )
    }

    if (JSON.stringify(codeBlocks(translated)) !== JSON.stringify(codeBlocks(english))) {
      throw new Error(`${locale}/${page} does not preserve the canonical Stack examples`)
    }
  }
}

const corpus = [...englishPages.values()].join("\n")
const requiredTerms = [
  "stack 1.0",
  "actor",
  "client",
  "service",
  "function",
  "worker",
  "database",
  "cache",
  "queue",
  "storage",
  "external",
  "flow",
  "request",
  "event",
  "data",
  "dependency",
  "rank same",
  "order",
  "default",
  "light",
  "dark",
  "STK1001",
  "STK6001",
]

for (const term of requiredTerms) {
  if (!corpus.includes(term))
    throw new Error(`English documentation is missing required coverage for ${term}`)
}

console.log(`Validated ${pages.length * (locales.length + 1)} documentation pages.`)
