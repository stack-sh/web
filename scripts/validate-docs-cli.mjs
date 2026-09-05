import assert from "node:assert/strict"
import { execFile } from "node:child_process"
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { promisify } from "node:util"

import { validateDocumentationContract } from "./docs-contract.mjs"
import { documentationContract } from "./docs-validation.config.mjs"

const execute = promisify(execFile)
const cli = process.env.STACK_CLI_BIN
if (!cli) throw new Error("STACK_CLI_BIN must point to the pinned Stack CLI binary")

const docsRoot = path.resolve(process.env.STACK_DOCS_ROOT ?? "docs")
const { documents, cliExamples } = await validateDocumentationContract({
  docsRoot,
  locales: documentationContract.locales,
  allowedFenceLanguages: documentationContract.allowedFenceLanguages,
  navigationPages: documentationContract.navigation.flatMap((section) =>
    section.items.map((item) => item.page),
  ),
  exceptions: documentationContract.exceptions,
})

const skill = await readFile("skills/stack-diagrams/SKILL.md", "utf8")
assert.match(skill, /^---\nname: stack-diagrams\ndescription: .+\nlicense: Apache-2.0\n---/)
const skillCommands = [...skill.matchAll(/```sh\n([\s\S]*?)```/g)].flatMap((match) =>
  match[1].trim().split("\n"),
)
assert.ok(skillCommands.length > 0, "Skill must include executable CLI examples")

const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), "stack-docs-cli-"))
try {
  const environment = {
    ...process.env,
    XDG_CONFIG_HOME: path.join(temporaryDirectory, "config"),
  }
  const run = (args) =>
    execute(cli, args, { cwd: temporaryDirectory, env: environment, encoding: "utf8" })

  const version = await run(["version"])
  assert.equal(version.stdout, `stack ${documentationContract.cli.version}\n`)
  assert.equal(version.stderr, "")

  const topLevelHelp = await run(["help"])
  for (const command of ["check", "fmt", "render", "icons", "help", "version"]) {
    assert.match(topLevelHelp.stdout, new RegExp(`\\b${command}\\b`))
  }
  const renderHelp = await run(["help", "render"])
  for (const option of ["--provider-pack", "-o", "--notice"]) {
    assert.ok(renderHelp.stdout.includes(option), `render help is missing ${option}`)
  }
  const importHelp = await run(["help", "icons", "import"])
  for (const option of ["--accept-terms", "-o"]) {
    assert.ok(importHelp.stdout.includes(option), `icons import help is missing ${option}`)
  }

  const exampleSource = documents
    .get("guide/getting-started.md")
    .codeBlocks.find((codeBlock) => codeBlock.language === "stack")?.body
  if (!exampleSource) throw new Error("Getting started does not provide a Stack example")
  await writeFile(path.join(temporaryDirectory, "architecture.stack"), `${exampleSource}\n`)
  await mkdir(path.join(temporaryDirectory, ".stack-icons"))

  const configuredExceptions = new Map()
  for (const exception of documentationContract.cli.executionExceptions) {
    if (typeof exception.reason !== "string" || exception.reason.trim().length === 0) {
      throw new Error("CLI example execution exceptions require a non-empty reason")
    }
    if (configuredExceptions.has(exception.prefix)) {
      throw new Error(`Duplicate CLI example exception: ${exception.prefix}`)
    }
    configuredExceptions.set(exception.prefix, exception)
  }

  const usedExceptions = new Set()
  let executedExamples = 0
  for (const command of [...new Set([...cliExamples, ...skillCommands])]) {
    const exception = [...configuredExceptions.keys()].find((prefix) => command.startsWith(prefix))
    if (exception) {
      usedExceptions.add(exception)
      continue
    }
    const arguments_ = command.split(/\s+/)
    if (arguments_.shift() !== "stack") throw new Error(`Invalid CLI example: ${command}`)
    const result = await run(arguments_)
    assert.doesNotMatch(result.stderr, /error\[/, `CLI example returned an error: ${command}`)
    executedExamples += 1
  }

  const staleExceptions = [...configuredExceptions.keys()].filter(
    (prefix) => !usedExceptions.has(prefix),
  )
  if (staleExceptions.length > 0) {
    throw new Error(`Unused CLI example exceptions: ${staleExceptions.join(", ")}`)
  }

  const generatedSvg = await readFile(path.join(temporaryDirectory, "architecture.svg"), "utf8")
  assert.match(generatedSvg, /<svg\b/)
  console.log(
    `Validated ${cliExamples.length} localized canonical CLI examples against stack ${documentationContract.cli.version}; executed ${executedExamples} safe unique examples and excluded ${usedExceptions.size} documented side-effecting command family.`,
  )
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true })
}
