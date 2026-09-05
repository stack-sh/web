import { readFile, readdir } from "node:fs/promises"
import path from "node:path"

import { validateDocumentationContract } from "./docs-contract.mjs"
import { documentationContract } from "./docs-validation.config.mjs"
import { digest, readDocsManifest } from "./docs-source.mjs"

const outputRoot = path.resolve("dist/docs")
const siteOutputRoot = path.resolve("dist")
const docsRoot = path.resolve("docs")
const sourceManifest = readDocsManifest()
const machineFiles = sourceManifest.files.filter((file) => file.path.startsWith("machine/"))
if (machineFiles.length < 4) throw new Error("Machine distribution is incomplete")
for (const file of machineFiles) {
  const bytes = await readFile(path.join(siteOutputRoot, file.path))
  if (digest(bytes) !== file.sha256) throw new Error(`Built machine asset drift: ${file.path}`)
}
const machineIndex = JSON.parse(
  await readFile(path.join(siteOutputRoot, "machine/index.json"), "utf8"),
)
const manifestPath = new URL(machineIndex.current.url).pathname.slice(1)
const machineManifest = await readFile(path.join(siteOutputRoot, manifestPath))
if (digest(machineManifest) !== machineIndex.current.sha256)
  throw new Error("Machine discovery digest mismatch")
const localePages = [
  ["index.html", "en-US"],
  ["ja/index.html", "ja-JP"],
  ["zh/index.html", "zh-CN"],
  ["ko/index.html", "ko-KR"],
]

const [playgroundHtml, sourceSocialImage, builtSocialImage, rootAgentIndex, robots, rootSitemap] =
  await Promise.all([
    readFile(path.join(siteOutputRoot, "index.html"), "utf8"),
    readFile(path.resolve("public/ogp.png")),
    readFile(path.join(siteOutputRoot, "ogp.png")),
    readFile(path.join(siteOutputRoot, "llms.txt"), "utf8"),
    readFile(path.join(siteOutputRoot, "robots.txt"), "utf8"),
    readFile(path.join(siteOutputRoot, "sitemap.xml"), "utf8"),
  ])

for (const metadata of [
  "<title>Stack</title>",
  'rel="canonical" href="https://stack-diagram.com/"',
  'property="og:image" content="https://stack-diagram.com/ogp.png"',
  'name="twitter:card" content="summary_large_image"',
  'type="application/ld+json"',
]) {
  if (!playgroundHtml.includes(metadata)) {
    throw new Error(`Built Playground metadata is missing: ${metadata}`)
  }
}

if (!sourceSocialImage.equals(builtSocialImage)) {
  throw new Error("Built social image does not match public/ogp.png")
}

if (!rootAgentIndex.startsWith("# Stack\n\n> ")) {
  throw new Error("Built root llms.txt is missing its title or summary")
}

if (!robots.includes("User-agent: OAI-SearchBot") || !robots.includes("Allow: /")) {
  throw new Error("Built robots.txt does not allow search crawling")
}

if (!rootSitemap.includes("<loc>https://stack-diagram.com/</loc>")) {
  throw new Error("Built root sitemap does not include the Playground")
}

for (const [page, language] of localePages) {
  const html = await readFile(path.join(outputRoot, page), "utf8")

  if (!html.includes(`<html lang="${language}"`))
    throw new Error(`${page} does not declare ${language}`)

  if (!html.includes('role="main" class="VPContent'))
    throw new Error(`${page} does not expose its content as a main landmark`)

  if (!html.includes('href="/docs/') && !html.includes('src="/docs/'))
    throw new Error(`${page} does not reference assets or routes below /docs/`)

  for (const metadata of [
    'rel="canonical" href="https://stack-diagram.com/docs/',
    'rel="alternate" type="text/markdown" href="/docs/',
    'rel="describedby" href="/docs/llms.txt"',
    'property="og:image" content="https://stack-diagram.com/ogp.png"',
    'name="twitter:card" content="summary_large_image"',
  ]) {
    if (!html.includes(metadata)) {
      throw new Error(`${page} is missing discovery metadata: ${metadata}`)
    }
  }

  const logoReferences = html.match(/src="\/docs\/favicon\.svg"/g)?.length ?? 0
  if (logoReferences < 4) {
    throw new Error(`${page} does not use the Stack logo in navigation and home hero`)
  }
}

for (const locale of ["", "ja/", "zh/", "ko/"]) {
  const page = `${locale}language/themes-and-icons.html`
  const html = await readFile(path.join(outputRoot, page), "utf8")
  const cards = html.match(/class="stack-icon-card"/g)?.length ?? 0

  if (cards !== 30) throw new Error(`${page} contains ${cards} icon cards instead of 30`)
}

for (const locale of ["", "ja/", "zh/", "ko/"]) {
  const page = `${locale}examples/index.html`
  const html = await readFile(path.join(outputRoot, page), "utf8")
  const cards = html.match(/class="stack-example-card"/g)?.length ?? 0
  const previews = html.match(/class="stack-example-preview"/g)?.length ?? 0

  if (cards !== 9) throw new Error(`${page} contains ${cards} example cards instead of 9`)
  if (previews !== 9) {
    throw new Error(`${page} contains ${previews} runtime example previews instead of 9`)
  }
  if (/src="[^"]*\/examples\/[^"]+\.svg/.test(html)) {
    throw new Error(`${page} references a pre-rendered example SVG`)
  }
}

const documentationAssets = await readdir(path.join(outputRoot, "assets"))

if (!documentationAssets.some((asset) => /^stack_engine_bg\..+\.wasm$/.test(asset))) {
  throw new Error("Built Documentation does not include the published Engine WebAssembly")
}

const sitemap = await readFile(path.join(outputRoot, "sitemap.xml"), "utf8")
const locations = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1])
const { pages } = await validateDocumentationContract({
  docsRoot,
  locales: documentationContract.locales,
  allowedFenceLanguages: documentationContract.allowedFenceLanguages,
  navigationPages: documentationContract.navigation.flatMap((section) =>
    section.items.map((item) => item.page),
  ),
  exceptions: documentationContract.exceptions,
})
const expectedLocations = pages.length * (documentationContract.locales.length + 1)

if (locations.length !== expectedLocations) {
  throw new Error(`Expected ${expectedLocations} sitemap locations, found ${locations.length}`)
}

for (const location of locations) {
  if (!location.startsWith("https://stack-diagram.com/docs/"))
    throw new Error(`Sitemap location escapes /docs/: ${location}`)

  if (location.endsWith(".html")) throw new Error(`Sitemap location is not clean: ${location}`)

  const route = new URL(location).pathname.replace(/^\/docs\//, "")
  const markdownPath = route.endsWith("/") || route === "" ? `${route}index.md` : `${route}.md`
  const htmlPath = markdownPath.replace(/\.md$/, ".html")
  const html = await readFile(path.join(outputRoot, htmlPath), "utf8")
  const editSource = /^(?:(?:ja|zh|ko)\/)?guide\/agent-workflow\.md$/.test(markdownPath)
    ? "content/agent-workflow.md"
    : `content/site/${markdownPath}`
  // Locale landing pages use VitePress's home layout, which has no edit footer.
  const isLocaleHome = /^(?:(?:ja|zh|ko)\/)?index\.md$/.test(markdownPath)
  if (!isLocaleHome && !html.includes(`https://github.com/stack-sh/docs/edit/main/${editSource}`)) {
    throw new Error(`Edit link does not target the canonical Docs source: ${htmlPath}`)
  }
  if (html.includes("https://github.com/stack-sh/web/edit/main/docs/")) {
    throw new Error(`Retired Web source edit link remains: ${htmlPath}`)
  }
  const markdown = await readFile(path.join(outputRoot, markdownPath), "utf8")

  if (!markdown.trim()) throw new Error(`Markdown alternate is empty: ${markdownPath}`)
  if (markdown.startsWith("---\n")) {
    throw new Error(`Markdown alternate still contains VitePress frontmatter: ${markdownPath}`)
  }
}

const [documentationAgentIndex, completeDocumentation] = await Promise.all([
  readFile(path.join(outputRoot, "llms.txt"), "utf8"),
  readFile(path.join(siteOutputRoot, "llms-full.txt"), "utf8"),
])

if (!documentationAgentIndex.includes("/docs/language/syntax.md")) {
  throw new Error("Documentation llms.txt does not link to the language syntax reference")
}

for (const requiredContent of [
  "# Stack",
  "# What is Stack?",
  "# Document and syntax",
  "# Diagnostics and limits",
]) {
  if (!completeDocumentation.includes(requiredContent)) {
    throw new Error(`Complete agent documentation is missing: ${requiredContent}`)
  }
}

console.log(
  `Validated site metadata, agent discovery files, four locale entry points, and all ${expectedLocations} sitemap locations.`,
)
