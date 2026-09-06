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

test("the Docs gallery only presents self-contained built-in examples", async () => {
  const gallery = await readFile("docs/.vitepress/theme/components/ExampleGallery.vue", "utf8")
  assert.match(gallery, /example\.providers\.length === 0/)
  assert.doesNotMatch(gallery, /__meta|__features|labels\[locale\]\.packs|expected\.description/)
  assert.match(gallery, /stack-example-card__source/)
})

test("ready previews open a native image dialog instead of navigating to source", async () => {
  const preview = await readFile("docs/.vitepress/theme/components/ExamplePreview.vue", "utf8")
  assert.match(preview, /<button\s+v-if="state.status === 'ready'"/)
  assert.match(preview, /aria-haspopup="dialog"/)
  assert.match(preview, /<ExampleLightbox/)
  assert.doesNotMatch(preview, /<a v-if="state.status === 'ready'"/)
})
