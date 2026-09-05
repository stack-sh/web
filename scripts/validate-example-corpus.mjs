import assert from "node:assert/strict"
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises"
import path from "node:path"

import init, { check, render } from "@stack-sh/engine"

const writeThumbnails = process.argv.includes("--write-thumbnails")
const corpusRoot = path.resolve("example-corpus")
const sourceRoot = path.join(corpusRoot, "sources")
const thumbnailRoot = path.resolve("docs/public/examples")
const catalog = JSON.parse(await readFile(path.join(corpusRoot, "catalog.json"), "utf8"))
const providerCatalog = JSON.parse(
  await readFile(path.resolve("docs/.vitepress/theme/data/provider-catalogs.json"), "utf8"),
)
const wasm = await readFile(path.resolve("node_modules/@stack-sh/engine/dist/stack_engine_bg.wasm"))
await init({ module_or_path: wasm })

const availableProviderIcons = new Set(
  providerCatalog.providers.flatMap((provider) => provider.icons.map((icon) => icon.id)),
)
const expectedSources = catalog.examples.map((example) => example.source).sort()
const actualSources = (await readdir(sourceRoot)).filter((entry) => entry.endsWith(".stack")).sort()
assert.deepEqual(actualSources, expectedSources, "Example source inventory does not match catalog")

function declarations(source, declaration) {
  return source.match(new RegExp(`^\\s*${declaration}\\s+`, "gm"))?.length ?? 0
}

const expectedThumbnails = []
for (const example of catalog.examples) {
  const source = await readFile(path.join(sourceRoot, example.source), "utf8")
  for (const field of ["nodes", "groups", "edges"]) {
    const declaration = field.slice(0, -1)
    assert.equal(
      declarations(source, declaration),
      example.expected[field],
      `${example.id} ${field} metadata does not match its source`,
    )
  }

  const providerIcons = [...source.matchAll(/icon "([a-z][a-z0-9-]+:[a-z0-9-]+)"/g)].map(
    (match) => match[1],
  )
  const providers = [...new Set(providerIcons.map((icon) => icon.split(":", 1)[0]))]
  assert.deepEqual(providers.sort(), [...example.providers].sort(), `${example.id} provider drift`)
  for (const icon of providerIcons) {
    assert.ok(availableProviderIcons.has(icon), `${example.id} uses unknown provider icon ${icon}`)
  }

  const checked = check(source)
  const rendered = render(source)
  for (const [operation, result] of [
    ["check", checked],
    ["render", rendered],
  ]) {
    const unexpected = result.diagnostics.filter((diagnostic) => diagnostic.code !== "STK5001")
    assert.deepEqual(
      unexpected,
      [],
      `${example.id} ${operation} returned unexpected diagnostics: ${unexpected.map((diagnostic) => diagnostic.code).join(", ")}`,
    )
    assert.equal(
      result.diagnostics.length,
      providerIcons.length,
      `${example.id} ${operation} provider fallback count does not match its source`,
    )
    assert.equal(result.metadata.engineVersion, "0.7.0")
    assert.deepEqual(result.metadata.languageVersion, { major: 1, minor: 0 })
  }

  assert.ok(rendered.svg, `${example.id} did not produce an SVG`)
  assert.match(rendered.svg, /<svg\b[^>]*\bviewBox="[^"]+"/)
  assert.doesNotMatch(rendered.svg, /<script\b|<foreignObject\b|\b(?:href|src)="https?:/i)

  const thumbnail = `${example.id}.svg`
  expectedThumbnails.push(thumbnail)
  const destination = path.join(thumbnailRoot, thumbnail)
  if (writeThumbnails) {
    await mkdir(thumbnailRoot, { recursive: true })
    await writeFile(destination, rendered.svg)
  } else {
    assert.equal(
      await readFile(destination, "utf8"),
      rendered.svg,
      `${thumbnail} is stale; run npm run examples:generate`,
    )
  }
}

const actualThumbnails = (await readdir(thumbnailRoot))
  .filter((entry) => entry.endsWith(".svg"))
  .sort()
assert.deepEqual(
  actualThumbnails,
  expectedThumbnails.sort(),
  "Example thumbnail inventory has drifted",
)
console.log(
  `${writeThumbnails ? "Generated" : "Validated"} ${catalog.examples.length} checked, rendered, and provider-resolved example thumbnails with @stack-sh/engine 0.7.0.`,
)
