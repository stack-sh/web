# Coding agentで使う

Coding agentでStackを読み書きすると、構成図をレビュー可能なsourceとして管理できます。言語referenceを読み、CLIをlocal実行するため、remote MCP serverは不要です。

## Skillの導入

`npx skills add stack-sh/web --skill stack-diagrams`で図作成skillだけをcurrent projectへ導入します。User全体へ導入したい場合だけ`-g`を付け、取得したinstructionを確認してください。CLI本体は別途必要です。再現可能な導入には`stack-sh/web`の代わりにimmutableなGitHub commit URLを指定します。

[SKILL.md](https://github.com/stack-sh/web/blob/main/skills/stack-diagrams/SKILL.md)

## 導入せずに使う

次のinstructionをagentへ渡し、作りたい構成を追記してください。HTTPSの参照とlocal command実行ができれば、skillに未対応のclientでも使えます。

```text
Use Stack to create or edit the architecture described below. Read https://stack-diagram.com/docs/llms.txt and the relevant syntax/examples. Preserve all requested components and relationships. Save editable architecture.stack. Check the installed CLI version/help, then check, format, and render architecture.svg locally. Read warnings as well as exit status, fix errors without removing requirements, and inspect the SVG if a viewer is available. Do not invent syntax or provider icon IDs. Report artifact paths, CLI version, and any validation gaps. Ask before installation or third-party terms acceptance when not already authorized.
```

## Localで検証

[はじめる](./getting-started)からCLIを導入し、未公開mainの機能ではなく実binaryのversionとhelpを確認します。CLI 0.4.0のcheck/renderは`--json`に未対応です。

```sh
$ stack --version
$ stack help
$ stack check architecture.stack
$ stack fmt architecture.stack
$ stack check architecture.stack
$ stack render architecture.stack -o architecture.svg
```

## Iconと制限

Provider icon IDを推測せず、第三者termsを自動承認しないでください。Packがなければsemantic kindを使い、vendor artworkが表示されていないと明示します。CLIやviewerが使えなければ未検証の範囲を報告します。Compile成功だけでは見やすい図とは限りません。

## 参照と更新

- [Examples](../examples/index)
- [Syntax](../language/syntax)
- [Diagnostics](../reference/diagnostics-and-limits)
- [Provider icons](./provider-icons)
- [Markdown index](https://stack-diagram.com/docs/llms.txt)
