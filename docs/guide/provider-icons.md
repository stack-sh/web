# Provider icons

Stack supports a provider-neutral core icon catalog without setup. AWS, Google Cloud, and Azure artwork is available through user-imported provider packs. The audited catalog below is public, but Stack does not host or redistribute the vendor SVG files.

## Available provider catalog

| Provider     | Audited release                            | Available IDs                                                                                                    | Official source and terms                                                                                                                         |
| ------------ | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| AWS          | `Icon-package_07312026`                    | `aws:s3`, `aws:sqs`, `aws:lambda`, `aws:ec2`, `aws:rds`, `aws:dynamodb`, `aws:eks`                               | [AWS Architecture Icons](https://aws.amazon.com/architecture/icons/) and [AWS Trademark Guidelines](https://aws.amazon.com/trademark-guidelines/) |
| Google Cloud | Core product icons from the May 2026 guide | `gcp:cloud-run`, `gcp:cloud-storage`, `gcp:compute-engine`, `gcp:gke`, `gcp:bigquery`, `gcp:cloud-sql`           | [Google Cloud Icon Library](https://cloud.google.com/icons) and [Google Brand Resource Center](https://about.google/brand-resource-center/)       |
| Azure        | `Azure_Public_Service_Icons_V24`           | `azure:virtual-machines`, `azure:storage-accounts`, `azure:azure-sql-database`, `azure:aks`, `azure:app-service` | [Azure Architecture Icons](https://learn.microsoft.com/azure/architecture/icons/) and the terms included in the official archive                  |

Every imported manifest records the official product name, source release, complete archive hash, terms URL, review date, permitted output categories, and non-endorsement notice. A provider pack adds only artwork; the authored node `kind` still controls its semantic styling and layout.

## Why artwork is not hosted

The reviewed vendor guidance permits particular diagram and documentation uses, but does not clearly grant Stack permission to repackage the SVG bytes in its website, npm package, WebAssembly module, or native binary. Static Documentation therefore shows the catalog, provenance, and exact IDs without copying vendor artwork.

After you load a pack, the Playground shows its actual icons from your selected local files. It creates browser-local image URLs only after Engine validation and does not inject the SVG as page HTML. Review the linked provider terms before using or distributing a generated diagram.

## Create a local pack

Download the official archive yourself, then use the public Stack CLI to process that local file:

```sh
stack icons import aws ~/Downloads/aws-icons.zip \
  --accept-terms \
  -o .stack-icons/aws
```

Replace `aws` with `gcp` or `azure` for the other audited profiles. The importer makes no network request or upload. It verifies the complete archive, reads only reviewed paths, removes active content, preserves colors and geometry, and creates `manifest.json`, `NOTICE.md`, and `assets/*.svg`.

## Use a pack in Playground

Open **Icons**, choose one pack's `manifest.json` and every declared file in `assets/`, then copy an ID from the local catalog into source:

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

## Use a pack offline in CLI

```sh
stack render architecture.stack \
  --provider-pack .stack-icons/aws \
  -o architecture.svg \
  --notice architecture.NOTICE.md
```

`--provider-pack` is repeatable. `stack fmt`, `stack check`, `stack render`, and `stack icons import` perform no network request; importing requires only that the official archive already exists locally. The CLI validates bounded pack inputs before rendering and records the exact used icons in the notice sidecar.

## Offline behavior

CLI authoring and SVG generation work fully offline after the CLI and any desired provider archives are on the device. Installing the CLI or obtaining a new official archive may require a connection.

The Web Playground also formats, checks, and renders locally after its JavaScript and WebAssembly have loaded. It has no server rendering dependency and provider files never leave the browser. The current website is not an installed offline app, however, so a cold start without a network connection is not guaranteed.
