import assert from "node:assert/strict"
import { readFile, readdir } from "node:fs/promises"
import test from "node:test"

test("documentation examples cannot retain pre-rendered SVG counterparts", async () => {
  const catalog = JSON.parse(await readFile("example-corpus/catalog.json", "utf8"))
  for (const root of ["public", "docs/public"]) {
    const files = await readdir(root, { recursive: true })
    for (const example of catalog.examples) {
      assert.ok(
        !files.some((file) => file.endsWith(`${example.id}.svg`)),
        `${example.id} must render at runtime`,
      )
    }
  }
  const gallery = await readFile("docs/.vitepress/theme/components/ExampleGallery.vue", "utf8")
  assert.match(gallery, /<ExamplePreview/)
  assert.doesNotMatch(gallery, /\.svg/)
  const scripts = JSON.parse(await readFile("package.json", "utf8")).scripts
  assert.ok(!("examples:generate" in scripts))
})
