import assert from "node:assert/strict"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import test from "node:test"
import { digest, fetchBundle, syncDocs, validateManifest } from "./docs-source.mjs"

function fixture(change = (manifest) => manifest) {
  const source = "canonical documentation\n"
  const manifest = change({
    schemaVersion: "1.0",
    cli: { repository: "stack-sh/cli", revision: "b".repeat(40), version: "0.4.0" },
    files: [
      "site/index.md",
      "skills/stack-diagrams/SKILL.md",
      "machine/index.json",
      "machine/v1.0.0/manifest.json",
    ].map((file) => ({
      path: file,
      sha256: digest(source),
    })),
  })
  const bytes = Buffer.from(JSON.stringify(manifest))
  const lock = {
    repository: "stack-sh/docs",
    revision: "a".repeat(40),
    manifestSha256: digest(bytes),
  }
  const fetchResource = async (url) => {
    assert.ok(
      url.startsWith(`https://raw.githubusercontent.com/stack-sh/docs/${lock.revision}/generated/`),
    )
    return new Response(url.endsWith("/generated/manifest.json") ? bytes : source)
  }
  return { source, bytes, lock, fetchResource }
}

test("retrieves verified immutable content and supplies only generated build inputs", async (t) => {
  const f = fixture()
  const directory = await mkdtemp(path.join(os.tmpdir(), "stack-web-docs-"))
  t.after(() => rm(directory, { recursive: true, force: true }))
  await syncDocs(directory, f.lock, f.fetchResource)
  assert.equal(await readFile(path.join(directory, "docs/index.md"), "utf8"), f.source)
  assert.equal(await readFile(path.join(directory, ".stack-docs/SKILL.md"), "utf8"), f.source)
  assert.equal(await readFile(path.join(directory, "public/machine/index.json"), "utf8"), f.source)
  assert.equal(
    await readFile(path.join(directory, "public/machine/v1.0.0/manifest.json"), "utf8"),
    f.source,
  )
  assert.deepEqual(
    JSON.parse(await readFile(path.join(directory, "public/docs-source.json"), "utf8")),
    f.lock,
  )
})

test("rejects mutable pins, traversal, duplicate paths, and unsupported manifests", async () => {
  const f = fixture()
  await assert.rejects(fetchBundle({ ...f.lock, revision: "main" }, f.fetchResource))
  for (const change of [
    (m) => ({ ...m, schemaVersion: "2.0" }),
    (m) => ({ ...m, files: [...m.files, m.files[0]] }),
    (m) => ({ ...m, files: [{ path: "site/../../README.md", sha256: "a".repeat(64) }] }),
    (m) => ({
      ...m,
      files: [...m.files, { path: "machine/v1.0.0/../../outside.json", sha256: "a".repeat(64) }],
    }),
    (m) => ({
      ...m,
      files: [...m.files, { path: "machine/latest/manifest.json", sha256: "a".repeat(64) }],
    }),
  ]) {
    const invalid = fixture(change)
    assert.throws(() => validateManifest(invalid.bytes, invalid.lock))
  }
})

test("fails on missing or altered resources before writing build inputs", async (t) => {
  const f = fixture()
  await assert.rejects(
    fetchBundle(f.lock, async () => new Response("missing", { status: 404 })),
    /HTTP 404/,
  )
  await assert.rejects(
    fetchBundle(f.lock, async () => new Response("altered")),
    /manifest integrity/,
  )
  const directory = await mkdtemp(path.join(os.tmpdir(), "stack-web-docs-reject-"))
  t.after(() => rm(directory, { recursive: true, force: true }))
  await assert.rejects(
    syncDocs(
      directory,
      f.lock,
      async (url) => new Response(url.endsWith("/generated/manifest.json") ? f.bytes : "altered"),
    ),
    /content integrity/,
  )
  await assert.rejects(readFile(path.join(directory, "docs/index.md")), { code: "ENOENT" })
})
