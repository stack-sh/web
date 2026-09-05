import { readFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import path from "node:path"

export function validateRelease(lock, release, revision) {
  const errors = []
  if (release.draft || release.prerelease || !/^v\d+\.\d+\.\d+$/.test(release.tag_name)) {
    errors.push("Expected a published stable CLI release")
  }
  if (release.tag_name !== `v${lock.version}`) {
    errors.push(
      `CLI release drift: docs ${lock.version}, latest ${release.tag_name}; update stack-sh/docs with npm run release:sync, then update this site's Docs pin`,
    )
  }
  if (revision !== lock.revision)
    errors.push("CLI release tag commit differs from the documentation pin")
  return errors
}

export function synchronizeVersion(source, version) {
  if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error("Invalid CLI version")
  if (!/Stack CLI \d+\.\d+\.\d+/.test(source)) throw new Error("Missing CLI version declaration")
  return source.replace(/Stack CLI \d+\.\d+\.\d+/g, `Stack CLI ${version}`)
}

async function github(endpoint) {
  const headers = { Accept: "application/vnd.github+json" }
  if (process.env.GH_TOKEN) headers.Authorization = `Bearer ${process.env.GH_TOKEN}`
  const response = await fetch(`https://api.github.com/repos/stack-sh/cli/${endpoint}`, {
    headers,
    signal: AbortSignal.timeout(15000),
  })
  if (!response.ok) throw new Error(`GitHub ${endpoint}: HTTP ${response.status}`)
  return response.json()
}

export async function latestRelease() {
  const release = await github("releases/latest")
  if (release.draft || release.prerelease || !/^v\d+\.\d+\.\d+$/.test(release.tag_name)) {
    throw new Error("Expected a published stable CLI release")
  }
  let { object } = await github(`git/ref/tags/${encodeURIComponent(release.tag_name)}`)
  for (let depth = 0; object.type === "tag" && depth < 4; depth += 1) {
    ;({ object } = await github(`git/tags/${object.sha}`))
  }
  if (object.type !== "commit" || !/^[a-f0-9]{40}$/.test(object.sha)) {
    throw new Error("CLI release tag does not resolve to a commit")
  }
  return { release, revision: object.sha }
}

async function main() {
  const { documentationContract } = await import("./docs-validation.config.mjs")
  const { cli } = documentationContract
  if (process.argv.includes("--sync"))
    throw new Error(
      "Documentation is generated. Run npm run release:sync in stack-sh/docs, merge, then update scripts/docs-source.json.",
    )
  const version = cli.version
  if (process.argv.includes("--live")) {
    const { release, revision } = await latestRelease()
    const errors = validateRelease(cli, release, revision)
    if (errors.length) throw new Error(errors.join("\n"))
  }
  for (const locale of ["", ...documentationContract.locales]) {
    const page = new URL(
      `../docs/${locale ? `${locale}/` : ""}guide/getting-started.md`,
      import.meta.url,
    )
    const source = await readFile(page, "utf8")
    const updated = synchronizeVersion(source, version)
    if (source !== updated) throw new Error(`Stale CLI version in ${fileURLToPath(page)}`)
  }
  console.log(`Validated CLI ${version} documentation.`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main()
}
