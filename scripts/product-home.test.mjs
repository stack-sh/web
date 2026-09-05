import assert from "node:assert/strict"
import test from "node:test"
import {
  readProductHome,
  productHomeMarkdown,
  validateBuiltProductHome,
  renderProductMetadata,
} from "./product-home.mjs"

const copy = {
  description: "Describe services & connections.",
  hero: {
    name: "Stack",
    tagline: "Write your stack.",
    actions: [
      { text: "Start", link: "/ja/guide/getting-started" },
      { text: "Try", link: "https://stack-diagram.com/" },
    ],
  },
  features: ["Beautiful", "Consistent", "Local"].map((title) => ({
    title,
    details: `${title} details.`,
  })),
}
const source = `---\nlayout: home\n${Object.entries(copy)
  .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
  .join("\n")}\n---\n`
const html = `<h1><span>Stack</span></h1><p class="stack-home-description">Describe services &amp; connections.</p>${copy.features.map(({ title, details }) => `<h2>${title}</h2><p>${details}</p>`).join("")}`

test("visible and machine-readable home copy share the provider metadata", () => {
  assert.deepEqual(readProductHome(source), copy)
  assert.ok(productHomeMarkdown(copy).startsWith("# Stack\n\nWrite your stack."))
  assert.ok(productHomeMarkdown(copy).includes("](/docs/ja/guide/getting-started)"))
  assert.ok(productHomeMarkdown(copy).includes("](https://stack-diagram.com/)"))
  validateBuiltProductHome(html, copy)
})

test("missing metadata, an expanded H1, or omitted benefits cannot pass the build gate", () => {
  assert.throws(() => readProductHome("# Not generated"))
  assert.throws(() =>
    readProductHome(source.replace('"name":"Stack"', '"name":"Stack","text":"Architecture"')),
  )
  for (const candidate of [
    html + "<h1>Extra</h1>",
    html.replace("<span>Stack</span>", "Stack Architecture"),
    html.replace("Consistent details.", ""),
    html.replace("stack-home-description", "hidden-description"),
  ]) {
    assert.throws(() => validateBuiltProductHome(candidate, copy))
  }
})

test("canonical tagline is escaped independently for HTML and JSON metadata", () => {
  const changed = structuredClone(copy)
  changed.hero.tagline = 'Text "quotes" & </script>'
  const rendered = renderProductMetadata(
    '<meta content="__STACK_DESCRIPTION_HTML__"><script>{"description":"__STACK_DESCRIPTION_JSON__"}</script>',
    changed,
  )
  assert.ok(rendered.includes('content="Text &quot;quotes&quot; &amp; &lt;/script&gt;"'))
  const json = rendered.match(/<script>(.*)<\/script>/)[1]
  assert.equal(JSON.parse(json).description, changed.hero.tagline)
  assert.ok(!json.includes("</script>"))
})
