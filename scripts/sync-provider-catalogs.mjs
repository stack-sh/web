import { createHash } from "node:crypto"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

const sourceRoot = path.resolve(process.argv[2] ?? "../cli/catalogs")
const outputPath = path.resolve("docs/.vitepress/theme/data/provider-catalogs.json")
const providers = ["aws", "gcp", "azure", "simple-icons"]
const digest = createHash("sha256")
const catalogs = []

for (const provider of providers) {
  const bytes = await readFile(path.join(sourceRoot, `${provider}.json`))
  digest.update(provider)
  digest.update("\0")
  digest.update(bytes)
  const source = JSON.parse(bytes.toString("utf8"))
  catalogs.push({
    id: source.provider.id,
    name: source.provider.name,
    source: {
      pageUrl: source.source.pageUrl,
      archiveUrl: source.source.archiveUrl,
      archiveSha256: source.source.archiveSha256,
      release: source.source.release,
      termsUrl: source.source.termsUrl,
    },
    additionalSources: (source.additionalSources ?? []).map((additionalSource) => ({
      id: additionalSource.id,
      pageUrl: additionalSource.pageUrl,
      archiveUrl: additionalSource.archiveUrl,
      archiveSha256: additionalSource.archiveSha256,
      release: additionalSource.release,
      termsUrl: additionalSource.termsUrl,
    })),
    icons: source.icons.map((icon) => ({
      id: icon.id,
      productName: icon.productName,
      category: icon.category,
      recommendedNodeKind: icon.recommendedNodeKind,
      ...(icon.brandSourceUrl ? { brandSourceUrl: icon.brandSourceUrl } : {}),
      ...(icon.brandGuidelinesUrl ? { brandGuidelinesUrl: icon.brandGuidelinesUrl } : {}),
    })),
  })
}

const iconCount = catalogs.reduce((total, catalog) => total + catalog.icons.length, 0)
const output = {
  catalogVersion: "1.0",
  sourceRepository: "stack-sh/cli",
  sourceRevision: `sha256:${digest.digest("hex")}`,
  iconCount,
  providers: catalogs,
}

await mkdir(path.dirname(outputPath), { recursive: true })
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`)
process.stdout.write(`Synced ${iconCount} asset-free provider icon records.\n`)
