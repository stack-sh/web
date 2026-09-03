# Stack Web

The minimal browser playground for the Stack architecture diagram language.

The top-level experience is a responsive source-to-SVG workspace: edit Stack source on the left, inspect the generated SVG on the right, and run formatting or validation from the toolbar. On smaller screens, the editor and preview stack vertically.

Documentation will be added under a nested route in a later initiative. Cloudflare Workers is the intended hosting target, but deployment and Git integration are intentionally not configured yet.

## Development

Requirements:

- Node.js 22.14 or newer
- Stable Rust with the `wasm32-unknown-unknown` target
- `wasm-bindgen-cli` 0.2.127

```sh
git clone --recurse-submodules git@github.com:stack-sh/web.git
cd web
rustup target add wasm32-unknown-unknown
cargo install wasm-bindgen-cli --version 0.2.127 --locked
npm ci
npm run dev
```

The WebAssembly adapter is built from the `stack-sh/engine` submodule pinned to the final merged engine revision. This source pin is temporary until `@stack-sh/engine` has a public package release.

## Commands

```sh
npm run dev
npm run format
npm run format:check
npm run lint
npm test
npm run build
npm run preview
```

Formatting and linting use Oxfmt and Oxlint. The production build generates the pinned Stack WebAssembly package before TypeScript and Vite compilation.

## Scope

The initial playground includes:

- Responsive editor and SVG preview panes
- `Format`, `Check`, and `Run` actions
- Portable diagnostics with source locations
- Safe SVG image preview and download

Authentication, persistence, collaboration, paid themes, documentation pages, deployment, and repository-to-Cloudflare Git integration are outside this first delivery.

Syntax highlighting is also deferred. A later iteration should consume a reusable public Stack grammar and register it as a custom Shiki language so browser and editor integrations share one definition.

## License

Repository-authored work is licensed under Apache-2.0. Bundled font files and their licenses are documented in [THIRD_PARTY_LICENSES.md](./THIRD_PARTY_LICENSES.md).
