import assert from "node:assert/strict"
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import test from "node:test"

import { validateDocumentationContract } from "./docs-contract.mjs"

const locales = ["ja", "zh", "ko"]
const allowedFenceLanguages = ["stack", "sh"]
const navigationPages = ["guide/page.md"]
const noExceptions = {
  pageParity: [],
  headingParity: [],
  codeBlockParity: [],
  links: [],
}
const home = `# Home

[Guide details](./guide/page#details)
[Stack](https://stack-diagram.com/)

\`\`\`sh
$ stack check architecture.stack
\`\`\`
`
const guide = `# Guide

## Details

\`\`\`stack
stack 1.0

diagram "Fixture" {
  node api "API"
}
\`\`\`
`

async function fixture() {
  const docsRoot = await mkdtemp(path.join(os.tmpdir(), "stack-docs-contract-"))
  const files = new Map([
    ["index.md", home],
    ["guide/page.md", guide],
  ])
  for (const locale of locales) {
    files.set(`${locale}/index.md`, home)
    files.set(`${locale}/guide/page.md`, guide)
  }
  for (const [file, source] of files) {
    const destination = path.join(docsRoot, file)
    await mkdir(path.dirname(destination), { recursive: true })
    await writeFile(destination, source)
  }
  return {
    docsRoot,
    write: async (file, source) => {
      const destination = path.join(docsRoot, file)
      await mkdir(path.dirname(destination), { recursive: true })
      await writeFile(destination, source)
    },
    remove: (file) => rm(path.join(docsRoot, file)),
    cleanup: () => rm(docsRoot, { recursive: true, force: true }),
  }
}

function validate(docsRoot, exceptions = noExceptions) {
  return validateDocumentationContract({
    docsRoot,
    locales,
    allowedFenceLanguages,
    navigationPages,
    exceptions,
  })
}

test("accepts matching locale pages, anchors, HTTPS links, and CLI examples", async (context) => {
  const docs = await fixture()
  context.after(docs.cleanup)

  const result = await validate(docs.docsRoot)

  assert.deepEqual(result.pages, ["guide/page.md", "index.md"])
  assert.deepEqual(result.cliExamples, ["stack check architecture.stack"])
})

test("rejects a missing locale page", async (context) => {
  const docs = await fixture()
  context.after(docs.cleanup)
  await docs.remove("ja/guide/page.md")

  await assert.rejects(validate(docs.docsRoot), /ja\/guide\/page\.md does not match/)
})

test("rejects pages missing from navigation", async (context) => {
  const docs = await fixture()
  context.after(docs.cleanup)

  await assert.rejects(
    validateDocumentationContract({
      docsRoot: docs.docsRoot,
      locales,
      allowedFenceLanguages,
      navigationPages: [],
      exceptions: noExceptions,
    }),
    /navigation does not match/,
  )
})

test("rejects missing link targets and anchors", async (context) => {
  const docs = await fixture()
  context.after(docs.cleanup)
  await docs.write("index.md", home.replace("./guide/page#details", "./guide/missing"))

  await assert.rejects(validate(docs.docsRoot), /links to missing target/)

  await docs.write("index.md", home.replace("#details", "#missing"))
  await assert.rejects(validate(docs.docsRoot), /links to missing anchor/)

  await docs.write("index.md", home.replace("#details", "#"))
  await assert.rejects(validate(docs.docsRoot), /has an empty anchor/)
})

test("does not resolve assets outside the documentation roots", async (context) => {
  const docs = await fixture()
  const outsideName = `${path.basename(docs.docsRoot)}-outside.txt`
  const outsidePath = path.join(docs.docsRoot, "..", outsideName)
  context.after(async () => {
    await docs.cleanup()
    await rm(outsidePath, { force: true })
  })
  await writeFile(outsidePath, "outside")
  await docs.write("guide/page.md", `${guide}\n[Outside](../../${outsideName})\n`)

  await assert.rejects(validate(docs.docsRoot), /links to missing target/)
})

test("rejects canonical code drift and malformed fences", async (context) => {
  const docs = await fixture()
  context.after(docs.cleanup)
  await docs.write("zh/index.md", home.replace("stack check", "stack fmt"))

  await assert.rejects(validate(docs.docsRoot), /does not preserve the canonical code examples/)

  await docs.write("zh/index.md", home.replace("```sh", "``` shell"))
  await assert.rejects(validate(docs.docsRoot), /malformed or unlabelled code fence/)
})

test("rejects malformed or unsafe external links", async (context) => {
  const docs = await fixture()
  context.after(docs.cleanup)
  await docs.write("index.md", home.replace("https://stack-diagram.com/", "http://example.com/"))

  await assert.rejects(validate(docs.docsRoot), /credential-free HTTPS link/)

  await docs.write("index.md", home.replace("https://stack-diagram.com/", "https://[invalid"))
  await assert.rejects(validate(docs.docsRoot), /invalid external link/)
})

test("requires a reason for intentional locale differences", async (context) => {
  const docs = await fixture()
  context.after(docs.cleanup)
  await docs.write("ko/index.md", home.replace("stack check", "stack fmt"))

  await assert.rejects(
    validate(docs.docsRoot, {
      ...noExceptions,
      codeBlockParity: [{ locale: "ko", page: "index.md" }],
    }),
    /requires a non-empty reason/,
  )

  await validate(docs.docsRoot, {
    ...noExceptions,
    codeBlockParity: [
      { locale: "ko", page: "index.md", reason: "Locale-specific command walkthrough" },
    ],
  })
})

test("rejects stale exceptions", async (context) => {
  const docs = await fixture()
  context.after(docs.cleanup)

  await assert.rejects(
    validate(docs.docsRoot, {
      ...noExceptions,
      headingParity: [{ locale: "ja", page: "index.md", reason: "No longer needed" }],
    }),
    /Unused documentation exceptions/,
  )
})
