import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("../", import.meta.url))
export const digest = (bytes) => createHash("sha256").update(bytes).digest("hex")
export const docsSource = JSON.parse(
  readFileSync(new URL("./docs-source.json", import.meta.url), "utf8"),
)

export function validateManifest(bytes, lock) {
  assert.equal(lock.repository, "stack-sh/docs")
  assert.match(lock.revision, /^[a-f0-9]{40}$/)
  assert.match(lock.manifestSha256, /^[a-f0-9]{64}$/)
  assert.equal(digest(bytes), lock.manifestSha256, "Docs manifest integrity mismatch")
  const manifest = JSON.parse(bytes.toString())
  assert.equal(manifest.schemaVersion, "1.0", "Unsupported Docs manifest")
  assert.equal(manifest.cli.repository, "stack-sh/cli")
  assert.match(manifest.cli.revision, /^[a-f0-9]{40}$/)
  assert.match(manifest.cli.version, /^\d+\.\d+\.\d+$/)
  assert.ok(Array.isArray(manifest.files) && manifest.files.length <= 1000)
  const seen = new Set()
  for (const file of manifest.files) {
    assert.match(
      file.path,
      /^(?:site\/(?:[a-z0-9-]+\/)*[a-z0-9-]+\.md|guide\/agent-workflow\.md|skills\/stack-diagrams\/SKILL\.md)$/,
    )
    assert.ok(!seen.has(file.path), "Duplicate Docs path")
    seen.add(file.path)
    assert.match(file.sha256, /^[a-f0-9]{64}$/)
  }
  assert.ok(seen.has("skills/stack-diagrams/SKILL.md"))
  assert.ok(seen.has("site/index.md"))
  return manifest
}

export async function fetchBundle(lock = docsSource, fetchResource = fetch) {
  assert.equal(lock.repository, "stack-sh/docs")
  assert.match(lock.revision, /^[a-f0-9]{40}$/)
  const base = `https://raw.githubusercontent.com/${lock.repository}/${lock.revision}/generated/`
  const get = async (file) => {
    const response = await fetchResource(base + file, { signal: AbortSignal.timeout(15_000) })
    assert.ok(response.ok, `Docs fetch failed: ${file} HTTP ${response.status}`)
    const bytes = Buffer.from(await response.arrayBuffer())
    assert.ok(bytes.length <= 1_048_576, "Docs resource exceeds limit")
    return bytes
  }
  const manifestBytes = await get("manifest.json")
  const manifest = validateManifest(manifestBytes, lock)
  const files = new Map()
  for (let i = 0; i < manifest.files.length; i += 8) {
    await Promise.all(
      manifest.files.slice(i, i + 8).map(async (file) => {
        const bytes = await get(file.path)
        assert.equal(digest(bytes), file.sha256, `Docs content integrity mismatch: ${file.path}`)
        files.set(file.path, bytes)
      }),
    )
  }
  return { manifest, manifestBytes, files }
}

export function readDocsManifest() {
  return validateManifest(readFileSync(path.join(root, ".stack-docs/manifest.json")), docsSource)
}

export async function readAgentSkill() {
  const manifest = readDocsManifest()
  const file = manifest.files.find((file) => file.path === "skills/stack-diagrams/SKILL.md")
  const bytes = await readFile(path.join(root, ".stack-docs/SKILL.md"))
  assert.equal(digest(bytes), file.sha256, "Agent skill integrity mismatch")
  return bytes.toString("utf8")
}

export async function syncDocs(directory = root, lock = docsSource, fetchResource = fetch) {
  // Verify the entire provider bundle before replacing any local build input.
  const { manifestBytes, files } = await fetchBundle(lock, fetchResource)
  for (const [file, bytes] of files) {
    const relative = file.startsWith("site/")
      ? `docs/${file.slice(5)}`
      : file === "skills/stack-diagrams/SKILL.md"
        ? ".stack-docs/SKILL.md"
        : null
    if (!relative) continue
    const target = path.join(directory, relative)
    await mkdir(path.dirname(target), { recursive: true })
    await writeFile(target, bytes)
  }
  await writeFile(path.join(directory, ".stack-docs/manifest.json"), manifestBytes)
  await mkdir(path.join(directory, "public"), { recursive: true })
  await writeFile(
    path.join(directory, "public/docs-source.json"),
    JSON.stringify(lock, null, 2) + "\n",
  )
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  assert.equal(
    process.argv.length,
    2,
    "No arguments supported; update the reviewed source pin in docs-source.json",
  )
  await syncDocs()
}
