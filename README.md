# Stack Web

The minimal browser playground for the Stack architecture diagram language.

The top-level experience is a responsive source-to-SVG workspace: edit Stack source on the left, inspect the generated SVG on the right, and run formatting or validation from the toolbar. On smaller screens, the editor and preview stack vertically.

Documentation will be added under a nested route in a later initiative. The playground is deployed to the `stack-web` Cloudflare Worker and served from [stack-diagram.com](https://stack-diagram.com/).

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
npm run format
npm run format:check
npm run lint
npm test
npm run build
npm run cloudflare:check
npm run preview
```

Formatting and linting use Oxfmt and Oxlint. The production build compiles TypeScript and Vite assets with the published Stack WebAssembly package.

## Scope

The initial playground includes:

- Responsive editor and SVG preview panes
- `Format`, `Check`, and `Run` actions
- Syntax highlighting from the shared Stack TextMate grammar
- Compiler-style diagnostics with source selection, code frames, expected values, help, and related locations
- Safe SVG image preview and download

Authentication, persistence, collaboration, paid themes, and documentation pages are outside this first delivery. Cloudflare configuration targets the `stack-web` Worker and publishes the Vite output as static assets.

The editor keeps a native textarea as the input surface and layers Shiki presentation behind it. Highlighting consumes the raw `@stack-sh/language/grammar` export and does not determine whether source is valid. Validation and diagnostic guidance continue to come only from `@stack-sh/engine`.

## License

Repository-authored work is licensed under Apache-2.0. Bundled font files and their licenses are documented in [THIRD_PARTY_LICENSES.md](./THIRD_PARTY_LICENSES.md).
