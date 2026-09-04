import { readFile } from "node:fs/promises"
import path from "node:path"

import init, { check } from "@stack-sh/engine"

import { validateDocumentationContract } from "./docs-contract.mjs"
import { documentationContract } from "./docs-validation.config.mjs"

const docsRoot = path.resolve("docs")
const packageMetadata = JSON.parse(await readFile(path.resolve("package.json"), "utf8"))
const wasm = await readFile(path.resolve("node_modules/@stack-sh/engine/dist/stack_engine_bg.wasm"))
await init({ module_or_path: wasm })

const { pages, documents } = await validateDocumentationContract({
  docsRoot,
  locales: documentationContract.locales,
  allowedFenceLanguages: documentationContract.allowedFenceLanguages,
  navigationPages: documentationContract.navigation.flatMap((section) =>
    section.items.map((item) => item.page),
  ),
  exceptions: documentationContract.exceptions,
})

const exceptions = new Map()
for (const exception of documentationContract.stackExecutionExceptions) {
  if (typeof exception.reason !== "string" || exception.reason.trim().length === 0) {
    throw new Error("Stack example execution exceptions require a non-empty reason")
  }
  const key = `${exception.page}:${exception.block}`
  if (exceptions.has(key)) throw new Error(`Duplicate Stack example exception: ${key}`)
  exceptions.set(key, exception)
}

const usedExceptions = new Set()
let checkedExamples = 0
for (const page of pages) {
  let stackBlockIndex = 0
  for (const codeBlock of documents.get(page).codeBlocks) {
    if (codeBlock.language !== "stack") continue
    const key = `${page}:${stackBlockIndex}`
    stackBlockIndex += 1
    if (exceptions.has(key)) {
      usedExceptions.add(key)
      continue
    }

    const result = check(codeBlock.body)
    const errors = result.diagnostics.filter((diagnostic) => diagnostic.severity === "error")
    if (errors.length > 0) {
      throw new Error(
        `${page}:${codeBlock.line} is not valid in @stack-sh/engine ${packageMetadata.dependencies["@stack-sh/engine"]}: ${errors.map((diagnostic) => diagnostic.code).join(", ")}`,
      )
    }
    if (result.metadata.engineVersion !== packageMetadata.dependencies["@stack-sh/engine"]) {
      throw new Error(`${page}:${codeBlock.line} ran against an unexpected Engine version`)
    }
    checkedExamples += 1
  }
}

const staleExceptions = [...exceptions.keys()].filter((key) => !usedExceptions.has(key))
if (staleExceptions.length > 0) {
  throw new Error(`Unused Stack example exceptions: ${staleExceptions.join(", ")}`)
}

console.log(
  `Checked ${checkedExamples} complete Stack examples with @stack-sh/engine ${packageMetadata.dependencies["@stack-sh/engine"]}; ${usedExceptions.size} documented fragment was excluded.`,
)
