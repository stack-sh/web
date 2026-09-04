import { describe, expect, it } from "vitest"

import { loadProviderIconStoreFiles } from "./provider-pack"

function manifest(providerId: string, providerName: string, iconId: string, asset: string) {
  return {
    packVersion: "0.3.0",
    provider: { id: providerId, name: providerName },
    source: {
      pageUrl: "https://example.com/icons",
      release: "fixture-1",
      reviewAfter: "2026-12-03",
      termsUrl: "https://example.com/terms",
    },
    additionalSources: [],
    icons: [{ asset: { path: asset }, id: iconId, productName: iconId }],
  }
}

function fileAt(path: string, contents: string, type?: string): File {
  const file = new File([contents], path.split("/").at(-1) ?? path, { type })
  Object.defineProperty(file, "webkitRelativePath", { value: path })
  return file
}

describe("loadProviderIconStoreFiles", () => {
  it("loads all known provider directories in canonical order", async () => {
    const result = await loadProviderIconStoreFiles([
      fileAt(
        "icons/simple-icons/manifest.json",
        JSON.stringify(
          manifest("simple-icons", "Simple Icons", "simple-icons:github", "assets/github.svg"),
        ),
      ),
      fileAt("icons/simple-icons/assets/github.svg", "<svg data-provider='simple-icons' />"),
      fileAt(
        "icons/gcp/manifest.json",
        JSON.stringify(manifest("gcp", "Google Cloud", "gcp:cloud-run", "assets/cloud-run.svg")),
      ),
      fileAt("icons/gcp/assets/cloud-run.svg", "<svg data-provider='gcp' />"),
      fileAt("icons/custom/manifest.json", "{}"),
    ])

    expect(result.map((pack) => pack.providerId)).toEqual(["gcp", "simple-icons"])
    expect(result[0].input.assets).toEqual([
      { path: "assets/cloud-run.svg", svg: "<svg data-provider='gcp' />" },
    ])
    expect(result[1].icons[0]).toEqual({
      id: "simple-icons:github",
      productName: "simple-icons:github",
      svg: "<svg data-provider='simple-icons' />",
    })
  })

  it("rejects a manifest whose provider does not match its directory", async () => {
    await expect(
      loadProviderIconStoreFiles([
        fileAt(
          "icons/aws/manifest.json",
          JSON.stringify(manifest("gcp", "Google Cloud", "gcp:cloud-run", "assets/icon.svg")),
        ),
        fileAt("icons/aws/assets/icon.svg", "<svg />"),
      ]),
    ).rejects.toThrow("Provider directory 'aws' contains a manifest for 'gcp'")
  })

  it("rejects unsafe links before they reach the UI", async () => {
    const unsafeManifest = manifest("aws", "AWS", "aws:s3", "assets/s3.svg")
    unsafeManifest.source.termsUrl = "javascript:alert(1)"

    await expect(
      loadProviderIconStoreFiles([
        fileAt("icons/aws/manifest.json", JSON.stringify(unsafeManifest)),
        fileAt("icons/aws/assets/s3.svg", "<svg />"),
      ]),
    ).rejects.toThrow("must be a valid HTTPS URL")
  })

  it("requires every declared asset", async () => {
    await expect(
      loadProviderIconStoreFiles([
        fileAt(
          "icons/azure/manifest.json",
          JSON.stringify(manifest("azure", "Azure", "azure:storage", "assets/storage.svg")),
        ),
      ]),
    ).rejects.toThrow("Select the provider asset 'assets/storage.svg'")
  })

  it("requires a selected folder with a known provider", async () => {
    await expect(loadProviderIconStoreFiles([new File(["{}"], "manifest.json")])).rejects.toThrow(
      "Choose the icon store as a folder",
    )

    await expect(
      loadProviderIconStoreFiles([fileAt("icons/custom/manifest.json", "{}")]),
    ).rejects.toThrow("does not contain a known provider pack")
  })
})
