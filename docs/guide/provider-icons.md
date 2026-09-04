# Provider icons

Stack supports a provider-neutral core icon catalog without setup. AWS, Google Cloud, Azure, and common developer or collaboration artwork is available through user-imported provider packs. The searchable catalog below is public metadata, but Stack does not host or redistribute the vendor SVG files.

## Available provider catalog

The audited catalog contains 1,051 IDs: 305 AWS Architecture Icons, all 19 Google Cloud core-product and 26 category icons, 639 Azure service icons after exact-byte deduplication, and 62 curated tool icons. Search or filter the complete list without loading any SVG bytes. Results are shown 100 at a time so the page remains usable on smaller devices.

<ProviderCatalog locale="en" />

Every imported manifest records the official product name, every contributing source release and archive hash, terms URL, review date, permitted output categories, and non-endorsement notice. Curated tool records also retain the rights owner's brand source and guideline links. A provider pack adds only artwork; the authored node `kind` still controls its semantic styling and layout.

## Why artwork is not hosted

The reviewed vendor guidance permits particular diagram and documentation uses, but does not clearly grant Stack permission to repackage every SVG byte in its website, npm package, WebAssembly module, or native binary. Static Documentation therefore shows searchable catalog metadata, provenance, and exact IDs without copying vendor artwork.

The curated tool archive comes from [Simple Icons](https://simpleicons.org/). Its CC0 distribution does not imply that every underlying brand mark is CC0, so inclusion is not permission or endorsement. Follow the per-icon source and guideline links shown above before use.

After you load a pack, the Playground shows its actual icons from your selected local files. It creates browser-local image URLs only after Engine validation and does not inject the SVG as page HTML. Review the linked provider terms before using or distributing a generated diagram.

## Create a local pack

Select an AWS, Google Cloud, Azure, or Simple Icons card above to see its exact audited download URL, expected SHA-256, and complete `curl` → `stack icons import` → `stack render` commands. The CLI rejects an archive if its bytes no longer match the reviewed hash.

```sh
$ stack icons list aws s3
$ stack icons list simple-icons github
```

Use `aws`, `gcp`, `azure`, or `simple-icons`. Google Cloud requires both official archives shown when its card is selected. The importer reads the files downloaded by `curl`; it does not fetch or upload them itself. It verifies every complete archive, reads only reviewed paths, removes active content, preserves colors and geometry, and creates `manifest.json`, `NOTICE.md`, and `assets/*.svg`.

## Use a pack in Playground

Open **Icons**, choose one pack's `manifest.json` and every declared file in `assets/`, then search the loaded local catalog and copy an ID into source:

```stack
stack 1.0

diagram "Storage" {
  node files "Amazon S3" {
    kind storage
    icon "aws:s3"
  }
}
```

The selected files stay in the current browser tab. The Playground does not upload, fetch, or persist the pack, so reloads require another selection. Use **Notice** beside the SVG download when a rendered diagram embeds provider artwork.

The Playground accepts an already processed pack, not a raw provider ZIP. Raw-archive verification and safe SVG processing remain in the CLI so browser code does not duplicate that security boundary.

## Use a pack in CLI

A single Stack file can use multiple providers. For example, this diagram uses Cloud Run from the Google Cloud pack and GitHub from the Simple Icons pack:

```stack
stack 1.0

diagram "Deploy from GitHub to Cloud Run" {
  node repository "GitHub" {
    kind external
    icon "simple-icons:github"
  }

  node service "Cloud Run" {
    kind service
    icon "gcp:cloud-run"
  }

  edge repository -> service "Deploy" {
    kind dependency
  }
}
```

After importing both packs with the commands shown in their catalog cards, repeat `--provider-pack` when rendering:

```sh
$ stack render architecture.stack \
  --provider-pack .stack-icons/gcp \
  --provider-pack .stack-icons/simple-icons \
  -o architecture.svg \
  --notice architecture.NOTICE.md
```

The CLI validates each bounded pack before rendering and records the exact used icons and source archives in the notice sidecar.

## Offline behavior

CLI authoring and SVG generation work fully offline after the CLI and any desired provider archives are on the device. Installing the CLI or obtaining a new official archive may require a connection.

The Web Playground also formats, checks, and renders locally after its JavaScript and WebAssembly have loaded. It has no server rendering dependency and provider files never leave the browser. The current website is not an installed offline app, however, so a cold start without a network connection is not guaranteed.
