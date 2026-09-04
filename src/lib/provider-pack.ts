import type { ProviderPackInput } from "@stack-sh/engine"

const MAX_PROVIDER_FILE_BYTES = 1024 * 1024
const MAX_PROVIDER_PACK_BYTES = 32 * 1024 * 1024
const KNOWN_PROVIDER_IDS = ["aws", "gcp", "azure", "simple-icons"] as const

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
  return browserFile.webkitRelativePath ?? ""
}

function normalizedRelativePath(path: string): string {
  const normalized = path.replaceAll("\\", "/")
  const segments = normalized.split("/")
  if (
    normalized.startsWith("/") ||
    segments.some((segment) => segment.length === 0 || segment === "." || segment === "..")
  ) {
    throw new Error(`Provider file path '${path}' is not a safe relative path.`)
  }
  return normalized
}

function matchAssetFile(filesByPath: ReadonlyMap<string, File>, assetPath: string): File {
  const candidates = filesByPath.get(assetPath)

  if (!candidates) {
    throw new Error(`Select the provider asset '${assetPath}' together with manifest.json.`)
  }
  return candidates
}

async function readBoundedText(file: File): Promise<string> {
  if (file.size > MAX_PROVIDER_FILE_BYTES) {
    throw new Error(`Provider file '${file.name}' exceeds the 1 MiB limit.`)
  }
  return file.text()
}

async function loadProviderPackFiles(
  filesByPath: ReadonlyMap<string, File>,
  manifestFile: File,
  expectedProviderId: string,
): Promise<LoadedProviderPack> {
  const files = Array.from(filesByPath.values())
  if (files.reduce((total, file) => total + file.size, 0) > MAX_PROVIDER_PACK_BYTES) {
    throw new Error(`Provider pack '${expectedProviderId}' exceeds the 32 MiB pack limit.`)
  }

  let manifestValue: unknown
  try {
    manifestValue = JSON.parse(await readBoundedText(manifestFile))
  } catch (error) {
    if (error instanceof SyntaxError) throw new Error("Provider manifest is not valid JSON.")
    throw error
  }
  const manifest = manifestFrom(manifestValue)
  if (manifest.provider.id !== expectedProviderId) {
    throw new Error(
      `Provider directory '${expectedProviderId}' contains a manifest for '${manifest.provider.id}'.`,
    )
  }

  const assets = await Promise.all(
    manifest.icons.map(async (icon) => {
      const assetPath = normalizedRelativePath(icon.asset.path)
      return {
        path: assetPath,
        svg: await readBoundedText(matchAssetFile(filesByPath, assetPath)),
      }
    }),
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

export async function loadProviderIconStoreFiles(
  selectedFiles: FileList | readonly File[],
): Promise<LoadedProviderPack[]> {
  const files = Array.from(selectedFiles)
  if (files.length === 0) throw new Error("Choose a Stack icon store folder.")

  const storeFiles = files.map((file) => {
    const relativePath = relativeFilePath(file)
    if (!relativePath) {
      throw new Error("Choose the icon store as a folder.")
    }
    const path = normalizedRelativePath(relativePath)
    return { file, path, segments: path.split("/") }
  })
  const roots = new Set(storeFiles.map(({ segments }) => segments[0]))
  if (roots.size !== 1) throw new Error("Choose one Stack icon store folder.")

  const packs = KNOWN_PROVIDER_IDS.flatMap((providerId) => {
    const providerFiles = storeFiles.filter(
      ({ segments }) => segments[1] === providerId && segments.length >= 3,
    )
    if (providerFiles.length === 0) return []

    const manifestFiles = providerFiles.filter(
      ({ segments }) => segments.length === 3 && segments[2] === "manifest.json",
    )
    if (manifestFiles.length !== 1) {
      throw new Error(`Provider directory '${providerId}' must contain one manifest.json.`)
    }

    const filesByPath = new Map<string, File>()
    for (const { file, segments } of providerFiles) {
      const providerPath = segments.slice(2).join("/")
      if (filesByPath.has(providerPath)) {
        throw new Error(`Provider directory '${providerId}' contains '${providerPath}' twice.`)
      }
      filesByPath.set(providerPath, file)
    }

    return [{ filesByPath, manifestFile: manifestFiles[0].file, providerId }]
  })

  if (packs.length === 0) {
    throw new Error("The selected folder does not contain a known provider pack.")
  }

  return Promise.all(
    packs.map(({ filesByPath, manifestFile, providerId }) =>
      loadProviderPackFiles(filesByPath, manifestFile, providerId),
    ),
  )
}
