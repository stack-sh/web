import { readFile } from "node:fs/promises"
import path from "node:path"

const pages = [
  "index.md",
  "guide/what-is-stack.md",
  "guide/getting-started.md",
  "guide/playground.md",
  "guide/provider-icons.md",
  "language/syntax.md",
  "language/nodes-and-groups.md",
  "language/edges-and-layout.md",
  "language/themes-and-icons.md",
  "language/formatting.md",
  "reference/diagnostics-and-limits.md",
  "reference/versioning-and-safety.md",
]

const locales = ["ja", "zh", "ko"]
const docsRoot = path.resolve("docs")
const packageMetadata = JSON.parse(await readFile(path.resolve("package.json"), "utf8"))

if (packageMetadata.dependencies["@stack-sh/engine"] !== "0.5.0") {
  throw new Error("Documentation must use the exact @stack-sh/engine 0.5.0 release")
}

const [
  playgroundLogo,
  documentationLogo,
  playgroundHtml,
  socialImage,
  rootAgentIndex,
  documentationAgentIndex,
  robots,
  rootSitemap,
] = await Promise.all([
  readFile(path.resolve("public/favicon.svg"), "utf8"),
  readFile(path.join(docsRoot, "public/favicon.svg"), "utf8"),
  readFile(path.resolve("index.html"), "utf8"),
  readFile(path.resolve("public/ogp.png")),
  readFile(path.resolve("public/llms.txt"), "utf8"),
  readFile(path.join(docsRoot, "public/llms.txt"), "utf8"),
  readFile(path.resolve("public/robots.txt"), "utf8"),
  readFile(path.resolve("public/sitemap.xml"), "utf8"),
])

if (playgroundLogo !== documentationLogo) {
  throw new Error("Playground and documentation logo assets do not match")
}

const siteDescription = "Write your Technical Stack, Get beautiful diagram"
const requiredMetadata = [
  "<title>Stack</title>",
  `name="description" content="${siteDescription}"`,
  'rel="canonical" href="https://stack-diagram.com/"',
  'rel="describedby" href="/llms.txt"',
  'property="og:title" content="Stack"',
  'property="og:image" content="https://stack-diagram.com/ogp.png"',
  'name="twitter:card" content="summary_large_image"',
  'type="application/ld+json"',
]

for (const metadata of requiredMetadata) {
  if (!playgroundHtml.includes(metadata)) {
    throw new Error(`Playground metadata is missing: ${metadata}`)
  }
}

if (
  socialImage.subarray(1, 4).toString("ascii") !== "PNG" ||
  socialImage.readUInt32BE(16) !== 1200 ||
  socialImage.readUInt32BE(20) !== 630
) {
  throw new Error("Social image must be a 1200x630 PNG")
}

for (const [name, source] of [
  ["root", rootAgentIndex],
  ["documentation", documentationAgentIndex],
]) {
  if (!source.startsWith("# Stack") || !source.includes("\n\n> ")) {
    throw new Error(`${name} llms.txt does not follow the expected Markdown structure`)
  }
}

for (const crawlerDirective of ["User-agent: OAI-SearchBot", "User-agent: *", "Allow: /"]) {
  if (!robots.includes(crawlerDirective)) {
    throw new Error(`robots.txt is missing: ${crawlerDirective}`)
  }
}

for (const sitemapUrl of [
  "https://stack-diagram.com/sitemap.xml",
  "https://stack-diagram.com/docs/sitemap.xml",
]) {
  if (!robots.includes(`Sitemap: ${sitemapUrl}`)) {
    throw new Error(`robots.txt does not advertise ${sitemapUrl}`)
  }
}

if (!rootSitemap.includes("<loc>https://stack-diagram.com/</loc>")) {
  throw new Error("Root sitemap does not include the Playground")
}

function codeBlocks(source) {
  return [...source.matchAll(/```stack\n([\s\S]*?)```/g)].map((match) => match[1])
}

function headingCount(source) {
  return source.match(/^#{1,4}\s+/gm)?.length ?? 0
}

const englishPages = new Map()

for (const page of pages) {
  const source = await readFile(path.join(docsRoot, page), "utf8")
  englishPages.set(page, source)
}

for (const locale of locales) {
  for (const page of pages) {
    const english = englishPages.get(page)
    const translated = await readFile(path.join(docsRoot, locale, page), "utf8")

    if (headingCount(translated) !== headingCount(english)) {
      throw new Error(
        `${locale}/${page} does not have the same heading coverage as the English page`,
      )
    }

    if (JSON.stringify(codeBlocks(translated)) !== JSON.stringify(codeBlocks(english))) {
      throw new Error(`${locale}/${page} does not preserve the canonical Stack examples`)
    }
  }
}

for (const [page, source] of englishPages) {
  if (page === "index.md" && !source.includes("light: /favicon.svg")) {
    throw new Error("English documentation home does not use the Stack logo")
  }
}

for (const locale of locales) {
  const source = await readFile(path.join(docsRoot, locale, "index.md"), "utf8")
  if (!source.includes("light: /favicon.svg")) {
    throw new Error(`${locale}/index.md does not use the Stack logo`)
  }
}

const corpus = [...englishPages.values()].join("\n")
const coreIconIds = [
  "api",
  "web",
  "mobile",
  "desktop",
  "server",
  "container",
  "cluster",
  "cloud",
  "scheduler",
  "webhook",
  "identity",
  "observability",
  "gateway",
  "load-balancer",
  "dns",
  "cdn",
  "firewall",
  "network",
  "event",
  "stream",
  "search",
  "analytics",
  "repository",
  "pipeline",
  "secret",
  "document",
  "task",
  "chat",
  "email",
  "ai",
]
const requiredTerms = [
  "stack 1.0",
  "actor",
  "client",
  "service",
  "function",
  "worker",
  "database",
  "cache",
  "queue",
  "storage",
  "external",
  "flow",
  "request",
  "event",
  "data",
  "dependency",
  "rank same",
  "order",
  "default",
  "light",
  "dark",
  "STK1001",
  "STK6001",
]

for (const term of requiredTerms) {
  if (!corpus.includes(term))
    throw new Error(`English documentation is missing required coverage for ${term}`)
}

for (const locale of ["", ...locales]) {
  const page = path.join(docsRoot, locale, "language/themes-and-icons.md")
  const source = await readFile(page, "utf8")
  const componentLocale = locale || "en"

  if (!source.includes(`<IconCatalog locale="${componentLocale}" />`)) {
    throw new Error(`${componentLocale}/language/themes-and-icons.md is missing its icon gallery`)
  }

  for (const iconId of coreIconIds) {
    if (!source.includes(`| \`${iconId}\``)) {
      throw new Error(`${locale || "en"}/language/themes-and-icons.md is missing ${iconId}`)
    }
  }
}

console.log(`Validated ${pages.length * (locales.length + 1)} documentation pages.`)
