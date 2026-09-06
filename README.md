# Stack Web

The public browser experience for the [Stack architecture diagram language](https://github.com/stack-sh/specification). It combines a local-first diagram Playground with the multilingual documentation site at [stack-diagram.com](https://stack-diagram.com/).

## Live surfaces

| Surface            | URL                                                             | Purpose                                                                          |
| ------------------ | --------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Playground         | [stack-diagram.com](https://stack-diagram.com/)                 | Write Stack source and render SVG in the browser                                 |
| Documentation      | [stack-diagram.com/docs](https://stack-diagram.com/docs/)       | Learn the language, CLI, themes, icons, configuration, and coding-agent workflow |
| Japanese           | [stack-diagram.com/docs/ja](https://stack-diagram.com/docs/ja/) | Japanese documentation                                                           |
| Simplified Chinese | [stack-diagram.com/docs/zh](https://stack-diagram.com/docs/zh/) | Simplified Chinese documentation                                                 |
| Korean             | [stack-diagram.com/docs/ko](https://stack-diagram.com/docs/ko/) | Korean documentation                                                             |

## What you can do

- Edit, format, check, and render Stack diagrams without sending source to a rendering server.
- Download safe standalone SVG produced by the same Engine used by the native CLI.
- Use contextual completion, semantic hover, source-linked diagnostics, and live preview.
- Import caller-selected provider icon packs locally in the browser.
- Browse canonical examples rendered at runtime with the current WebAssembly Engine.
- Learn the complete workflow in four languages or install the coding-agent skill with `npx skills add stack-sh/cli`.

The responsive workspace places source and preview side by side on larger screens and stacks them on smaller screens. The editor suspends completion during IME composition, and all rendering and language intelligence run locally through the pinned `@stack-sh/engine` WebAssembly package.

## Start locally

Requirements:

- Node.js 22.14 or newer

```sh
git clone git@github.com:stack-sh/web.git
cd web
npm ci
npm run dev
```

Web builds consume published `@stack-sh/engine` and `@stack-sh/language` packages, so a Rust toolchain is not required for normal development.

Useful commands:

| Command                    | Purpose                                                  |
| -------------------------- | -------------------------------------------------------- |
| `npm run dev`              | Start the Playground and retrieve the pinned Docs bundle |
| `npm run docs:dev`         | Start the multilingual documentation site                |
| `npm test`                 | Run Playground and documentation tests                   |
| `npm run lint`             | Run Oxlint                                               |
| `npm run format:check`     | Check formatting with Oxfmt                              |
| `npm run build`            | Build the production Playground and Docs bundle          |
| `npm run cloudflare:check` | Validate the Cloudflare deployment without publishing    |

## How the pieces fit

- [`stack-sh/docs`](https://github.com/stack-sh/docs) owns the user-facing Markdown, CLI release identity, coding-agent skill, and machine-readable documentation bundle.
- This repository pins a verified Docs commit, builds its four locales, and serves the generated site together with the Playground.
- Canonical `.stack` examples come from a pinned [specification](https://github.com/stack-sh/specification) revision and render in the visitor's browser. Example SVG files are not checked in.
- [`@stack-sh/engine`](https://www.npmjs.com/package/@stack-sh/engine) provides formatting, diagnostics, completion, hover, deterministic layout, and safe SVG rendering.
- Cloudflare Workers serves the combined static output. Authentication, persistence, collaboration, and paid themes are outside this repository.

The public site also exposes search metadata, localized Markdown alternatives, `llms.txt`, and versioned machine resources for coding agents and tools.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for Docs pinning, example synchronization, validation, metadata, and deployment procedures.

## License

Repository-authored work is licensed under [Apache-2.0](./LICENSE). Bundled font files and their licenses are documented in [THIRD_PARTY_LICENSES.md](./THIRD_PARTY_LICENSES.md).
