import { readFile, readdir } from "node:fs/promises"
import path from "node:path"

import { validateDocumentationContract } from "./docs-contract.mjs"
import { documentationContract } from "./docs-validation.config.mjs"

const outputRoot = path.resolve("dist/docs")
const siteOutputRoot = path.resolve("dist")
const docsRoot = path.resolve("docs")
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
  const thumbnails = html.match(/class="stack-example-card__preview"/g)?.length ?? 0

  if (cards !== 9) throw new Error(`${page} contains ${cards} example cards instead of 9`)
  if (thumbnails !== 9) {
    throw new Error(`${page} contains ${thumbnails} example thumbnails instead of 9`)
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
