# 使用 coding agent

使用 coding agent 读写 Stack，可将架构图作为可审查的源文件管理。agent 阅读语言参考并在本地执行 CLI，不需要远程 MCP 服务器。

## 安装 skill

使用 `npx skills add stack-sh/web --skill stack-diagrams` 仅将图表 skill 安装到当前项目。仅在需要用户级安装时添加 `-g`，并检查下载的指令。CLI 需要单独安装。需要可复现安装时，将 `stack-sh/web` 替换为不可变的 GitHub commit URL。

[SKILL.md](https://github.com/stack-sh/web/blob/main/skills/stack-diagrams/SKILL.md)

## 不安装也能使用

将以下指令复制给 agent，并补充架构需求。只要客户端可以读取 HTTPS 页面和运行本地命令，即使不支持 skill 也能使用。

```text
Use Stack to create or edit the architecture described below. Read https://stack-diagram.com/docs/llms.txt and the relevant syntax/examples. Preserve all requested components and relationships. Save editable architecture.stack. Check the installed CLI version/help, then check, format, and render architecture.svg locally. Read warnings as well as exit status, fix errors without removing requirements, and inspect the SVG if a viewer is available. Do not invent syntax or provider icon IDs. Report artifact paths, CLI version, and any validation gaps. Ask before installation or third-party terms acceptance when not already authorized.
```

## 本地验证

通过[快速开始](./getting-started)安装 CLI。检查实际二进制的版本和帮助，不要依赖尚未发布的 main 功能。CLI 0.4.0 的 check/render 不支持 `--json`。

```sh
$ stack --version
$ stack help
$ stack check architecture.stack
$ stack fmt architecture.stack
$ stack check architecture.stack
$ stack render architecture.stack -o architecture.svg
```

## 图标与限制

不要猜测提供商图标 ID 或自动接受第三方条款。缺少图标包时使用语义 kind，并说明没有呈现品牌图标。如果无法使用 CLI 或查看器，请报告未验证范围。编译成功不代表布局清晰。

## 参考与更新

- [Examples](../examples/index)
- [Syntax](../language/syntax)
- [Diagnostics](../reference/diagnostics-and-limits)
- [Provider icons](./provider-icons)
- [Markdown index](https://stack-diagram.com/docs/llms.txt)
