import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"

if (!process.env.STACK_CLI_BIN) throw new Error("STACK_CLI_BIN is required")
const temporary = await mkdtemp(path.join(os.tmpdir(), "stack-docs-negative-"))
try {
  const docsRoot = path.join(temporary, "docs")
  await cp("docs", docsRoot, { recursive: true, filter: (entry) => !entry.includes(".vitepress") })
  for (const locale of ["", "ja", "zh", "ko"]) {
    const page = path.join(docsRoot, locale, "guide/getting-started.md")
    await writeFile(
      page,
      `${await readFile(page, "utf8")}\n\`\`\`sh\nstack check architecture.stack --not-a-real-option\n\`\`\`\n`,
    )
  }
  assert.throws(
    () =>
      execFileSync(process.execPath, ["scripts/validate-docs-cli.mjs"], {
        env: { ...process.env, STACK_DOCS_ROOT: docsRoot },
        stdio: "pipe",
      }),
    (error) => {
      assert.notEqual(error.status, 0)
      assert.match(error.stderr.toString(), /unexpected argument.*--not-a-real-option/)
      return true
    },
  )
  console.log("Documentation smoke rejects unsupported CLI flags.")
} finally {
  await rm(temporary, { recursive: true, force: true })
}
