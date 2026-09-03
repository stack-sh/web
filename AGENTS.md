# Stack Web Contribution Guide

## Scope

This repository owns the browser playground and future documentation site for Stack. Language semantics, diagnostics, formatting, layout, and SVG generation belong to the provider repositories and must not be reimplemented here.

## Language

Repository content, code comments, commits, issues, and pull requests must be written in English.

## Tooling

- Use React, TypeScript, and Vite.
- Use shadcn/ui components for shared controls.
- Use Oxfmt for formatting and Oxlint for linting.
- Run `npm run format`, `npm run lint`, `npm test`, and `npm run build` after code changes.
- Keep `stack-sh/engine` pinned to a merged provider revision until the npm package is released.

## UI

- Keep the playground minimal, monochrome, responsive, keyboard accessible, and usable at 320px.
- Desktop uses a source editor on the left and an SVG preview on the right. Mobile stacks them vertically.
- Treat engine diagnostics as user-visible results and operational failures as a separate state.
- Display generated SVG as an image. Do not mix arbitrary HTML or network content into engine output.

## Delivery

Use topic branches and pull requests. Do not push implementation changes directly to `main`. Deployment, Cloudflare Git integration, authentication, and documentation implementation require separate tasks.
