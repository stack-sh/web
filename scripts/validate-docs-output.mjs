import { readFile } from "node:fs/promises"
import path from "node:path"

const outputRoot = path.resolve("dist/docs")
const localePages = [
  ["index.html", "en-US"],
  ["ja/index.html", "ja-JP"],
  ["zh/index.html", "zh-CN"],
  ["ko/index.html", "ko-KR"],
]

for (const [page, language] of localePages) {
  const html = await readFile(path.join(outputRoot, page), "utf8")

  if (!html.includes(`<html lang="${language}"`))
    throw new Error(`${page} does not declare ${language}`)

  if (!html.includes('role="main" class="VPContent'))
    throw new Error(`${page} does not expose its content as a main landmark`)

  if (!html.includes('href="/docs/') && !html.includes('src="/docs/'))
    throw new Error(`${page} does not reference assets or routes below /docs/`)
}

const sitemap = await readFile(path.join(outputRoot, "sitemap.xml"), "utf8")
const locations = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1])

if (locations.length !== 44)
  throw new Error(`Expected 44 sitemap locations, found ${locations.length}`)

for (const location of locations) {
  if (!location.startsWith("https://stack-diagram.com/docs/"))
    throw new Error(`Sitemap location escapes /docs/: ${location}`)

  if (location.endsWith(".html")) throw new Error(`Sitemap location is not clean: ${location}`)
}

console.log("Validated the four locale entry points and all 44 sitemap locations.")
