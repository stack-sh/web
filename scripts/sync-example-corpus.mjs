import assert from "node:assert/strict"
import { execFile } from "node:child_process"
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises"
import path from "node:path"
import { promisify } from "node:util"

import { exampleCorpusSource } from "./example-corpus.config.mjs"

const execute = promisify(execFile)
const sourceRootValue = process.env.STACK_SPECIFICATION_ROOT
if (!sourceRootValue) {
  throw new Error("STACK_SPECIFICATION_ROOT must point to the pinned specification checkout")
}

const checkOnly = process.argv.includes("--check")
const sourceRoot = path.resolve(sourceRootValue)
const destinationRoot = path.resolve("example-corpus")
const destinationSources = path.join(destinationRoot, "sources")
const { stdout: revisionOutput } = await execute("git", ["rev-parse", "HEAD"], {
  cwd: sourceRoot,
  encoding: "utf8",
})
assert.equal(
  revisionOutput.trim(),
  exampleCorpusSource.revision,
  "Specification checkout does not match the pinned example corpus revision",
)

const sourceCatalog = await readFile(path.join(sourceRoot, exampleCorpusSource.catalogPath), "utf8")
const sourceSchema = await readFile(path.join(sourceRoot, exampleCorpusSource.schemaPath), "utf8")
const catalog = JSON.parse(sourceCatalog)
const expectedSources = catalog.examples.map((example) => example.source).sort()
const snapshots = new Map([
  [path.join(destinationRoot, "catalog.json"), sourceCatalog],
  [path.join(destinationRoot, "schema.json"), sourceSchema],
])
for (const source of expectedSources) {
  snapshots.set(
    path.join(destinationSources, source),
    await readFile(path.join(sourceRoot, "examples", source), "utf8"),
  )
}

if (checkOnly) {
  const actualSources = (await readdir(destinationSources))
    .filter((entry) => entry.endsWith(".stack"))
    .sort()
  assert.deepEqual(actualSources, expectedSources, "Vendored example source inventory has drifted")
  for (const [destination, expected] of snapshots) {
    assert.equal(
      await readFile(destination, "utf8"),
      expected,
      `${path.relative(process.cwd(), destination)} has drifted from the pinned specification`,
    )
  }
  console.log(
    `Verified ${expectedSources.length} example snapshots against ${exampleCorpusSource.repository}@${exampleCorpusSource.revision}.`,
  )
} else {
  await mkdir(destinationSources, { recursive: true })
  for (const entry of await readdir(destinationSources)) {
    if (entry.endsWith(".stack") && !expectedSources.includes(entry)) {
      await rm(path.join(destinationSources, entry))
    }
  }
  for (const [destination, contents] of snapshots) {
    await mkdir(path.dirname(destination), { recursive: true })
    await writeFile(destination, contents)
  }
  console.log(
    `Synchronized ${expectedSources.length} examples from ${exampleCorpusSource.repository}@${exampleCorpusSource.revision}.`,
  )
}
