# Themes and icons

A theme is a symbolic, diagram-level reference to a renderer-managed visual system. Icons are logical names resolved inside that theme. Neither feature changes diagram meaning.

## Select a theme

Add at most one `theme` statement directly inside the diagram:

```stack
stack 1.0

diagram "Dark architecture" {
  theme dark

  node api "API"
}
```

If the statement is omitted, Stack uses `default`. Draft Stack 1.0 requires the core catalog to contain:

| Theme     | Intended use                                                  |
| --------- | ------------------------------------------------------------- |
| `default` | Balanced blue-gray surfaces for general architecture diagrams |
| `light`   | Warm neutral surfaces for light documents                     |
| `dark`    | High-contrast cool surfaces for dark canvases                 |

The source selects an identifier, not a catalog package version. Render metadata records the catalog version and content revision so an output can identify the visual data it used.

The generated diagram theme is independent from the Playground's light or dark interface. A theme may change palette, typography metrics, surfaces, icons, connectors, and background treatment. It cannot hide or change nodes, groups, edges, labels, kinds, direction, or layout constraints.

## Fallback behavior

The three core themes are required renderer resources. A requested non-core theme that is unavailable emits warning `STK6001` and renders with `default`. The engine never fetches a theme from the network just because its identifier appears in source.

Theme identifiers use normal Stack identifier syntax. Once registered, an identifier cannot later name a different theme, even after deprecation.

## Kind fallback icons

Every theme provides one fallback for each node kind. If you omit `icon`, this is what the renderer uses.

| Node kind  | Current logical fallback icon |
| ---------- | ----------------------------- |
| `actor`    | `kind-actor`                  |
| `client`   | `kind-client`                 |
| `service`  | `kind-service`                |
| `function` | `kind-function`               |
| `worker`   | `kind-worker`                 |
| `database` | `kind-database`               |
| `cache`    | `kind-cache`                  |
| `queue`    | `kind-queue`                  |
| `storage`  | `kind-storage`                |
| `external` | `kind-external`               |

The current open core catalog contains these ten fallback identifiers in `default`, `light`, and `dark`. It does not yet contain vendor icons such as `postgresql`, `aws`, or `github`. In most documents, choose the semantic `kind` and omit `icon`.

## Explicit icons

An explicit icon is a quoted logical identifier:

```stack
stack 1.0

diagram "Explicit icon" {
  node gateway "Public API" {
    kind service
    icon "api"
  }
}
```

The icon decorates the node; it does not change the `service` kind, identity, label, or accessible description. The same identifier in different themes represents the same logical subject, although its color and artwork may adapt to the theme.

## First-party icon catalog

The free core catalog includes these provider-neutral explicit icons in `default`, `light`, and `dark`:

| ID              | Stable subject                    | Use it for                         |
| --------------- | --------------------------------- | ---------------------------------- |
| `api`           | Application programming interface | Public or internal APIs            |
| `web`           | Web application                   | Browser-facing web experiences     |
| `mobile`        | Mobile application                | iOS or Android clients             |
| `desktop`       | Desktop application               | Native desktop clients             |
| `server`        | Server host                       | Virtual machines or physical hosts |
| `container`     | Application container             | Containerized workloads            |
| `cluster`       | Compute cluster                   | Orchestrated compute groups        |
| `cloud`         | Cloud environment                 | Provider-neutral cloud boundaries  |
| `scheduler`     | Scheduled execution               | Cron jobs or scheduled work        |
| `webhook`       | Webhook endpoint                  | Inbound or outbound callbacks      |
| `identity`      | Identity and access               | Authentication or authorization    |
| `observability` | Observability system              | Metrics, logs, or traces           |

<IconCatalog locale="en" />

Use the semantic `kind` independently from the explicit icon. For example, `icon "web"` may decorate either a `client` or `service` node without changing what that node means.

## Missing and vendor icons

The core catalog does not currently include vendor or project marks such as `postgresql`, `aws`, `github`, or `docker`. If the effective theme does not provide an authored icon identifier, rendering continues with the node's kind fallback and warning `STK5001`.

Prefer a provider-neutral icon above or omit `icon` when its kind fallback already communicates the role. Vendor marks require asset-specific license, redistribution, and trademark review before they can ship in a separate catalog.

## Catalog and asset safety

The public `stack-sh/theme` catalog owns palettes, deterministic font metrics, node-kind visuals, connectors, icon metadata, SVG bytes, provenance, and redistribution permissions. Catalog assets are bundled with the renderer; authored identifiers are never treated as file paths or URLs.

SVG validation rejects scripts, event handlers, nested SVG documents, unsafe references, data or network URLs, style attributes, and elements or attributes outside an allowlist. Icons are not the only accessible indication of meaning: labels and non-color visual distinctions remain required.
