import assert from "node:assert/strict"

const escapeHtml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")

export function renderProductMetadata(html, copy) {
  return html
    .replaceAll("__STACK_DESCRIPTION_HTML__", escapeHtml(copy.hero.tagline))
    .replaceAll(
      '"__STACK_DESCRIPTION_JSON__"',
      JSON.stringify(copy.hero.tagline).replaceAll("<", "\\u003c"),
    )
}

export function readProductHome(source) {
  const block = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  assert.ok(block, "Generated product home metadata is missing")
  const copy = {}
  // The provider emits one JSON-escaped YAML scalar/object per line.
  for (const key of ["description", "hero", "features"]) {
    const line = block[1].split(/\r?\n/).find((line) => line.startsWith(`${key}: `))
    assert.ok(line, `Missing product home ${key}`)
    copy[key] = JSON.parse(line.slice(key.length + 2))
  }
  assert.equal(copy.hero.name, "Stack")
  assert.equal(copy.hero.text, undefined, "Only the product name belongs in the H1")
  assert.equal(copy.features.length, 3)
  assert.ok(copy.description.length > 0 && copy.hero.tagline.length > 0)
  return copy
}

export function productHomeMarkdown(copy) {
  return [
    `# ${copy.hero.name}`,
    "",
    copy.hero.tagline,
    "",
    copy.description,
    "",
    ...copy.features.flatMap(({ title, details }) => [`## ${title}`, "", details, ""]),
    ...copy.hero.actions.map(
      ({ text, link }) => `- [${text}](${link.startsWith("/") ? `/docs${link}` : link})`,
    ),
    "",
  ].join("\n")
}

export function validateBuiltProductHome(html, copy) {
  const headings = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)]
  assert.equal(headings.length, 1, "Product home must have one H1")
  assert.equal(headings[0][1].replace(/<[^>]+>/g, "").trim(), "Stack")
  assert.match(html, /class="stack-home-description"/)
  assert.ok(html.includes(escapeHtml(copy.description)), "Visible product description is missing")
  for (const feature of copy.features) {
    assert.ok(html.includes(escapeHtml(feature.title)), `Missing benefit: ${feature.title}`)
    assert.ok(
      html.includes(escapeHtml(feature.details)),
      `Missing benefit details: ${feature.title}`,
    )
  }
}
