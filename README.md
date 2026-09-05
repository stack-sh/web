# Stack Web

The browser playground and documentation site for the Stack architecture diagram language.

The top-level experience is a responsive source-to-SVG workspace: edit Stack source on the left, inspect the generated SVG on the right, and run formatting or validation from the toolbar. On smaller screens, the editor and preview stack vertically.

The playground is deployed to the `stack-web` Cloudflare Worker at [stack-diagram.com](https://stack-diagram.com/). Its multilingual VitePress documentation is built into the same static asset bundle and served from [`/docs/`](https://stack-diagram.com/docs/).

## Development

Requirements:

- Node.js 22.14 or newer

```sh
git clone git@github.com:stack-sh/web.git
cd web
npm ci
npm run dev
```

The WebAssembly adapter and editor language assets are installed from the exact public `@stack-sh/engine` and `@stack-sh/language` versions in `package.json`. Web builds do not require a Rust toolchain.

## Commands

```sh
npm run dev
npm run docs:dev
npm run docs:check
npm run docs:test
npm run examples:check
npm run format
npm run format:check
npm run lint
npm test
npm run build
npm run cloudflare:check
npm run preview
npm run docs:preview
```

Formatting and linting use Oxfmt and Oxlint. The production build compiles the React playground into `dist/`, validates the English, Japanese, Simplified Chinese, and Korean documentation sets, and builds VitePress with a `/docs/` base into `dist/docs/`.

## Documentation contract

`npm run docs:check` validates that all four locales have the same page inventory, heading structure, and canonical code blocks. It also rejects broken internal links and anchors, unsafe external links, malformed code fences, and Stack examples that fail against the exact `@stack-sh/engine` version in `package.json`. `npm run docs:test` exercises the corresponding positive and negative fixtures.

CI additionally builds the Stack CLI revision pinned in [`scripts/docs-validation.config.mjs`](./scripts/docs-validation.config.mjs) with its minimum supported Rust version, then runs `npm run docs:smoke` through `STACK_CLI_BIN`. This checks the documented version, help surface, and safe executable examples without adding Rust to normal Web builds. Intentional locale or execution differences must be declared in the same configuration with a non-empty reason; the validator rejects stale exceptions.

The example gallery is generated from the public specification commit pinned in [`scripts/example-corpus.config.mjs`](./scripts/example-corpus.config.mjs). [`example-corpus`](./example-corpus) is a hermetic snapshot for the Playground and documentation build; CI checks every catalog, schema, and `.stack` source byte against the pinned provider commit. `npm run examples:check` checks and renders all examples, resolves every namespaced icon against the published provider catalog, and detects stale SVG thumbnails. To intentionally advance the corpus, check out the new pinned specification revision, run `STACK_SPECIFICATION_ROOT=/path/to/specification npm run examples:sync`, and then run `npm run examples:generate`.

## Brand mark

[`public/favicon.svg`](./public/favicon.svg) is the canonical Stack logo mark for Web surfaces. The Playground uses it as its favicon and header mark; VitePress uses the identical [`docs/public/favicon.svg`](./docs/public/favicon.svg) copy for its favicon, navigation, and localized home pages. The documentation validator rejects the build if the two public-root copies differ.

## Discovery metadata

The Playground publishes canonical, Open Graph, Twitter Card, and `WebApplication` JSON-LD metadata from `index.html`. [`public/ogp.png`](./public/ogp.png) is the shared 1200×630 social image for the Playground and documentation.

[`public/robots.txt`](./public/robots.txt) permits public search crawling and advertises both sitemaps. [`public/llms.txt`](./public/llms.txt) and [`docs/public/llms.txt`](./docs/public/llms.txt) provide curated agent entry points. The VitePress build also emits clean Markdown alternatives for every documentation page and generates `/llms-full.txt` from the complete English documentation, so the agent-facing content stays synchronized with its public source.

## Keeping CLI documentation current

`scripts/docs-validation.config.mjs` pins the published CLI version and its exact release commit. Run `npm run docs:release:sync` after a stable CLI release to update that pin and all four Getting Started version declarations together. Review any changed command behavior, then run `STACK_CLI_BIN=/absolute/path/to/the/verified/release/stack npm run docs:smoke` and the normal build checks before opening a PR. The sync command does not install a CLI, accept provider terms, or publish changes.

The required CI baseline compares the pin against GitHub's latest stable release and resolved tag commit, executes documentation commands using both the pinned source and the attested published Linux archive, and verifies that an unsupported flag fails the documentation smoke. Offline documentation builds check locale version consistency without contacting GitHub. The read-only `Release freshness` workflow checks daily and on manual dispatch, so a CLI-only release cannot remain silently stale until someone edits this repository. A failed run requires a synchronization PR and a verified Web deployment; this workflow does not auto-merge or auto-publish. GitHub scheduled runs may be delayed, and GitHub Actions notification preferences govern failure notifications.

## Playground scope

The initial playground includes:

- Responsive editor and SVG preview panes
- `Format`, `Check`, and `Run` actions
- Syntax highlighting from the shared Stack TextMate grammar
- Distinct, accessible syntax palettes for light and dark color modes
- Compiler-style diagnostics with source selection, code frames, expected values, help, and related locations
- Contextual completion, semantic hover, inline diagnostic ranges, and debounced live preview
- Safe SVG image preview, expanded dialog, and download
- User-selected provider icon stores with searchable AWS, Google Cloud, Azure, and tool artwork

Authentication, persistence, collaboration, and paid themes remain outside this delivery. Cloudflare configuration targets the `stack-web` Worker and publishes the combined Vite and VitePress output as static assets.

The editor keeps a native textarea as the input surface and layers Shiki presentation behind it. Highlighting consumes the raw `@stack-sh/language/grammar` export and does not determine whether source is valid. The Web-owned Shiki themes map grammar scopes to accessible light and dark colors. Validation and diagnostic guidance continue to come only from `@stack-sh/engine`.

Language intelligence runs locally through `@stack-sh/engine` 0.7.0 WebAssembly; it does not start an LSP server or send source to a server. Suggestions follow typing or `Ctrl Space`; use arrow keys to choose, `Enter` or `Tab` to accept, and `Escape` to dismiss. The Context panel follows the caret or pointer. Imported provider packs supply their icon catalog to the same engine APIs. The adapter converts browser UTF-16 selections to engine source positions, rejects stale document results, and suspends completion during IME composition. Diagnostics and preview refresh from the same source snapshot after editing, while explicit actions remain available.

## License

Repository-authored work is licensed under Apache-2.0. Bundled font files and their licenses are documented in [THIRD_PARTY_LICENSES.md](./THIRD_PARTY_LICENSES.md).
