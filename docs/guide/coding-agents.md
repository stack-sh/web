# Coding agents

Use Stack with a coding agent to keep architecture diagrams as reviewable source. The agent can read the language reference and run the CLI locally; a remote MCP server is not required.

## Install the skill

Install only the diagram skill with `npx skills add stack-sh/web --skill stack-diagrams`. This installs into the current project; add `-g` only when you want a user-wide installation. Review the downloaded instructions before use. This installs instructions, not the Stack CLI. For a reproducible installation, clone the repository, check out a reviewed commit, then run `npx skills add /absolute/path/to/web --skill stack-diagrams`. The installer does not accept a raw commit SHA as a remote branch.

[SKILL.md](https://github.com/stack-sh/web/blob/main/skills/stack-diagrams/SKILL.md)

## Without installation

Copy this instruction into your agent and add the architecture requirements. The same prompt works without a skill-aware client, provided it can read HTTPS pages and execute local commands.

```text
Use Stack to create or edit the architecture described below. Read https://stack-diagram.com/docs/llms.txt and the relevant syntax/examples. Preserve all requested components and relationships. Save editable architecture.stack. Check the installed CLI version/help, then check, format, and render architecture.svg locally. Read warnings as well as exit status, fix errors without removing requirements, and inspect the SVG if a viewer is available. Do not invent syntax or provider icon IDs. Report artifact paths, CLI version, and any validation gaps. Ask before installation or third-party terms acceptance when not already authorized.
```

## Validate locally

Install the CLI through [Getting started](./getting-started). Check its version and help rather than relying on unreleased GitHub main features. CLI 0.4.0 does not support check/render `--json`.

```sh
$ stack --version
$ stack help
$ stack check architecture.stack
$ stack fmt architecture.stack
$ stack check architecture.stack
$ stack render architecture.stack -o architecture.svg
```

## Icons and limitations

Do not guess provider icon IDs or accept third-party terms automatically. Use semantic kinds when a pack is unavailable, and state that vendor artwork was not rendered. If the CLI or a viewer is unavailable, report the corresponding validation gap. Successful compilation does not prove readable layout.

## Reference and updates

- [Examples](../examples/index)
- [Syntax](../language/syntax)
- [Diagnostics](../reference/diagnostics-and-limits)
- [Provider icons](./provider-icons)
- [Markdown index](https://stack-diagram.com/docs/llms.txt)
