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

## Brand mark

[`public/favicon.svg`](./public/favicon.svg) is the canonical Stack logo mark for Web surfaces. The Playground uses it as its favicon and header mark; VitePress uses the identical [`docs/public/favicon.svg`](./docs/public/favicon.svg) copy for its favicon, navigation, and localized home pages. The documentation validator rejects the build if the two public-root copies differ.

## Discovery metadata

The Playground publishes canonical, Open Graph, Twitter Card, and `WebApplication` JSON-LD metadata from `index.html`. [`public/ogp.png`](./public/ogp.png) is the shared 1200×630 social image for the Playground and documentation.

[`public/robots.txt`](./public/robots.txt) permits public search crawling and advertises both sitemaps. [`public/llms.txt`](./public/llms.txt) and [`docs/public/llms.txt`](./docs/public/llms.txt) provide curated agent entry points. The VitePress build also emits clean Markdown alternatives for every documentation page and generates `/llms-full.txt` from the complete English documentation, so the agent-facing content stays synchronized with its public source.

## Scope

The initial playground includes:

- Responsive editor and SVG preview panes
- `Format`, `Check`, and `Run` actions
- Syntax highlighting from the shared Stack TextMate grammar
- Distinct, accessible syntax palettes for light and dark color modes
- Compiler-style diagnostics with source selection, code frames, expected values, help, and related locations
- Safe SVG image preview, expanded dialog, and download

Authentication, persistence, collaboration, and paid themes remain outside this delivery. Cloudflare configuration targets the `stack-web` Worker and publishes the combined Vite and VitePress output as static assets.

The editor keeps a native textarea as the input surface and layers Shiki presentation behind it. Highlighting consumes the raw `@stack-sh/language/grammar` export and does not determine whether source is valid. The Web-owned Shiki themes map grammar scopes to accessible light and dark colors. Validation and diagnostic guidance continue to come only from `@stack-sh/engine`.

## License

Repository-authored work is licensed under Apache-2.0. Bundled font files and their licenses are documented in [THIRD_PARTY_LICENSES.md](./THIRD_PARTY_LICENSES.md).
