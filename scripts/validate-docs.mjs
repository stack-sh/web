import { readFile } from "node:fs/promises"
import path from "node:path"

import { validateDocumentationContract } from "./docs-contract.mjs"
import { documentationContract } from "./docs-validation.config.mjs"

const docsRoot = path.resolve("docs")
const locales = documentationContract.locales
const { pages, englishPages } = await validateDocumentationContract({
  docsRoot,
  locales,
  allowedFenceLanguages: documentationContract.allowedFenceLanguages,
  navigationPages: documentationContract.navigation.flatMap((section) =>
    section.items.map((item) => item.page),
  ),
  exceptions: documentationContract.exceptions,
})
const packageMetadata = JSON.parse(await readFile(path.resolve("package.json"), "utf8"))
const providerCatalog = JSON.parse(
  await readFile(path.join(docsRoot, ".vitepress/theme/data/provider-catalogs.json"), "utf8"),
)

if (packageMetadata.dependencies["@stack-sh/engine"] !== "0.6.0") {
  throw new Error("Documentation must use the exact @stack-sh/engine 0.6.0 release")
}

const expectedProviderCounts = { aws: 305, gcp: 45, azure: 639, "simple-icons": 62 }
if (
  providerCatalog.catalogVersion !== "1.0" ||
  providerCatalog.sourceRepository !== "stack-sh/cli" ||
  providerCatalog.sourceRevision !==
    "sha256:fef0a6ba6d40a5205617b70fa8b874859acbe6e5eeeb1ef8bab7a2fd5b7f19bf" ||
  providerCatalog.iconCount !== 1051
) {
  throw new Error("Provider catalog metadata is invalid")
}
const providerIds = new Set()
for (const provider of providerCatalog.providers) {
  if (provider.icons.length !== expectedProviderCounts[provider.id]) {
    throw new Error(`Provider catalog has an unexpected ${provider.id} count`)
  }
  const providerSources = [provider.source, ...provider.additionalSources]
  const expectedAdditionalSourceIds = provider.id === "gcp" ? ["categories"] : []
  if (
    JSON.stringify(provider.additionalSources.map((source) => source.id)) !==
    JSON.stringify(expectedAdditionalSourceIds)
  ) {
    throw new Error(`${provider.id} has unexpected additional sources`)
  }
  for (const source of providerSources) {
    if (
      !source.pageUrl.startsWith("https://") ||
      !source.archiveUrl.startsWith("https://") ||
      !source.termsUrl.startsWith("https://") ||
      !/^sha256:[0-9a-f]{64}$/.test(source.archiveSha256) ||
      source.release.length === 0
    ) {
      throw new Error(`${provider.id} has invalid public source metadata`)
    }
  }
  for (const icon of provider.icons) {
    if (providerIds.has(icon.id) || !icon.id.startsWith(`${provider.id}:`)) {
      throw new Error(`Provider catalog has an invalid or duplicate ID: ${icon.id}`)
    }
    providerIds.add(icon.id)
    if (JSON.stringify(icon).includes("<svg") || "archivePath" in icon) {
      throw new Error(`Provider documentation must not contain asset bytes or archive paths`)
    }
    if (
      provider.id === "simple-icons" &&
      (!icon.brandSourceUrl?.startsWith("https://") ||
        !icon.brandGuidelinesUrl?.startsWith("https://"))
    ) {
      throw new Error(`${icon.id} is missing per-brand guidance`)
    }
  }
}
if (providerIds.size !== 1051) throw new Error("Provider catalog IDs are incomplete")

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

for (const locale of ["", ...locales]) {
  const page = path.join(docsRoot, locale, "guide/provider-icons.md")
  const source = await readFile(page, "utf8")
  const componentLocale = locale || "en"
  if (!source.includes(`<ProviderCatalog locale="${componentLocale}" />`)) {
    throw new Error(`${componentLocale}/guide/provider-icons.md is missing its provider catalog`)
  }
  for (const providerPack of ["gcp", "simple-icons"]) {
    if (!source.includes(`stack icons import ${providerPack} --accept-terms`)) {
      throw new Error(`${componentLocale}/guide/provider-icons.md is missing ${providerPack}`)
    }
  }
  for (const command of [
    "stack render architecture.stack -o architecture.svg",
    "--provider-pack .stack-icons",
    "default_icons_path: /absolute/path/to/stack-icons",
  ]) {
    if (!source.includes(command)) {
      throw new Error(`${componentLocale}/guide/provider-icons.md is missing ${command}`)
    }
  }
  for (const iconId of ["gcp:cloud-run", "simple-icons:github"]) {
    if (!source.includes(`icon "${iconId}"`)) {
      throw new Error(`${componentLocale}/guide/provider-icons.md is missing ${iconId}`)
    }
  }
}

const providerCatalogComponent = await readFile(
  path.join(docsRoot, ".vitepress/theme/components/ProviderCatalog.vue"),
  "utf8",
)
if (!providerCatalogComponent.includes("stack icons import ${item.id} --accept-terms")) {
  throw new Error("Provider catalog cards must show the provider import command")
}
for (const legacyCommand of ["curl -fL", "--source"]) {
  if (providerCatalogComponent.includes(legacyCommand)) {
    throw new Error(`Provider catalog still contains legacy command ${legacyCommand}`)
  }
}

console.log(`Validated ${pages.length * (locales.length + 1)} documentation pages.`)
