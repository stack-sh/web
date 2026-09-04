import type { ProviderPackInput } from "@stack-sh/engine"

const MAX_PROVIDER_FILE_BYTES = 1024 * 1024
const MAX_PROVIDER_PACK_BYTES = 32 * 1024 * 1024

interface ProviderManifestIcon {
  id: string
  productName: string
  asset: {
    path: string
  }
}

export interface LoadedProviderSource {
  id: string
  pageUrl: string
  release: string
  termsUrl: string
  reviewAfter: string
}

interface ProviderManifest {
  packVersion: string
  provider: {
    id: string
    name: string
  }
  source: LoadedProviderSource
  additionalSources: LoadedProviderSource[]
  icons: ProviderManifestIcon[]
}

export interface LoadedProviderIcon {
  id: string
  productName: string
  svg: string
}

export interface LoadedProviderPack {
  input: ProviderPackInput
  providerId: string
  providerName: string
  packVersion: string
  sources: readonly LoadedProviderSource[]
  icons: readonly LoadedProviderIcon[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function requiredString(record: Record<string, unknown>, field: string): string {
  const value = record[field]
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Provider manifest field '${field}' must be a non-empty string.`)
  }
  return value
}

function requiredRecord(record: Record<string, unknown>, field: string): Record<string, unknown> {
  const value = record[field]
  if (!isRecord(value)) {
    throw new Error(`Provider manifest field '${field}' must be an object.`)
  }
  return value
}

function httpsUrl(record: Record<string, unknown>, field: string): string {
  const value = requiredString(record, field)
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new Error(`Provider manifest field '${field}' must be a valid HTTPS URL.`)
  }
  if (url.protocol !== "https:") {
    throw new Error(`Provider manifest field '${field}' must be a valid HTTPS URL.`)
  }
  return url.toString()
}

function sourceFrom(record: Record<string, unknown>, id: string): LoadedProviderSource {
  return {
    id,
    pageUrl: httpsUrl(record, "pageUrl"),
    release: requiredString(record, "release"),
    termsUrl: httpsUrl(record, "termsUrl"),
    reviewAfter: requiredString(record, "reviewAfter"),
  }
}

function manifestFrom(value: unknown): ProviderManifest {
  if (!isRecord(value)) throw new Error("Provider manifest must be a JSON object.")

  const provider = requiredRecord(value, "provider")
  const source = requiredRecord(value, "source")
  const additionalSourcesValue = value.additionalSources
  if (additionalSourcesValue !== undefined && !Array.isArray(additionalSourcesValue)) {
    throw new Error("Provider manifest field 'additionalSources' must be an array.")
  }
  const additionalSources = (additionalSourcesValue ?? []).map((sourceValue, index) => {
    if (!isRecord(sourceValue)) {
      throw new Error(`Provider manifest additional source ${index + 1} must be an object.`)
    }
    return sourceFrom(sourceValue, requiredString(sourceValue, "id"))
  })
  const iconsValue = value.icons
  if (!Array.isArray(iconsValue) || iconsValue.length === 0) {
    throw new Error("Provider manifest must declare at least one icon.")
  }

  const icons = iconsValue.map((iconValue, index): ProviderManifestIcon => {
    if (!isRecord(iconValue)) {
      throw new Error(`Provider manifest icon ${index + 1} must be an object.`)
    }
    const asset = requiredRecord(iconValue, "asset")
    return {
      id: requiredString(iconValue, "id"),
      productName: requiredString(iconValue, "productName"),
      asset: { path: requiredString(asset, "path") },
    }
  })

  return {
    packVersion: requiredString(value, "packVersion"),
    provider: {
      id: requiredString(provider, "id"),
      name: requiredString(provider, "name"),
    },
    source: sourceFrom(source, "primary"),
    additionalSources,
    icons,
  }
}

function relativeFilePath(file: File): string {
  const browserFile = file as File & { webkitRelativePath?: string }
  return browserFile.webkitRelativePath || file.name
}

function matchAssetFile(files: readonly File[], assetPath: string): File {
  const suffix = `/${assetPath}`
  const candidates = files.filter((file) => {
    const relativePath = relativeFilePath(file)
    return (
      relativePath === assetPath ||
      relativePath.endsWith(suffix) ||
      (relativePath === file.name && file.name === assetPath.split("/").at(-1))
    )
  })

  if (candidates.length === 0) {
    throw new Error(`Select the provider asset '${assetPath}' together with manifest.json.`)
  }
  if (candidates.length > 1) {
    throw new Error(`More than one selected file matches provider asset '${assetPath}'.`)
  }
  return candidates[0]
}

async function readBoundedText(file: File): Promise<string> {
  if (file.size > MAX_PROVIDER_FILE_BYTES) {
    throw new Error(`Provider file '${file.name}' exceeds the 1 MiB limit.`)
  }
  return file.text()
}

export async function loadProviderPackFiles(
  selectedFiles: FileList | readonly File[],
): Promise<LoadedProviderPack> {
  const files = Array.from(selectedFiles)
  if (files.length === 0) throw new Error("Select a provider manifest and its SVG assets.")
  if (files.reduce((total, file) => total + file.size, 0) > MAX_PROVIDER_PACK_BYTES) {
    throw new Error("Selected provider files exceed the 32 MiB pack limit.")
  }

  const manifests = files.filter((file) => file.name === "manifest.json")
  if (manifests.length !== 1) {
    throw new Error("Select exactly one manifest.json for each provider pack import.")
  }

  let manifestValue: unknown
  try {
    manifestValue = JSON.parse(await readBoundedText(manifests[0]))
  } catch (error) {
    if (error instanceof SyntaxError) throw new Error("Provider manifest is not valid JSON.")
    throw error
  }
  const manifest = manifestFrom(manifestValue)

  const assets = await Promise.all(
    manifest.icons.map(async (icon) => ({
      path: icon.asset.path,
      svg: await readBoundedText(matchAssetFile(files, icon.asset.path)),
    })),
  )
  const svgByPath = new Map(assets.map((asset) => [asset.path, asset.svg]))

  return {
    input: {
      manifest: manifestValue as Readonly<Record<string, unknown>>,
      assets,
    },
    providerId: manifest.provider.id,
    providerName: manifest.provider.name,
    packVersion: manifest.packVersion,
    sources: [manifest.source, ...manifest.additionalSources],
    icons: manifest.icons.map((icon) => ({
      id: icon.id,
      productName: icon.productName,
      svg: svgByPath.get(icon.asset.path) ?? "",
    })),
  }
}
