# Coding agent 사용

Coding agent로 Stack을 읽고 쓰면 아키텍처 다이어그램을 검토 가능한 소스로 관리할 수 있습니다. 언어 레퍼런스를 읽고 CLI를 로컬에서 실행하므로 원격 MCP 서버가 필요하지 않습니다.

## Skill 설치

`npx skills add stack-sh/web --skill stack-diagrams`로 현재 프로젝트에 다이어그램 skill만 설치합니다. 사용자 전체에 설치하려는 경우에만 `-g`를 추가하고 다운로드한 지침을 검토하세요. CLI는 별도로 설치해야 합니다. 재현 가능한 설치에는 `stack-sh/web` 대신 불변 GitHub commit URL을 사용하세요.

[SKILL.md](https://github.com/stack-sh/web/blob/main/skills/stack-diagrams/SKILL.md)

## 설치 없이 사용

다음 지침을 agent에게 전달하고 아키텍처 요구 사항을 추가하세요. HTTPS 문서를 읽고 로컬 명령을 실행할 수 있다면 skill 미지원 클라이언트에서도 사용할 수 있습니다.

```text
Use Stack to create or edit the architecture described below. Read https://stack-diagram.com/docs/llms.txt and the relevant syntax/examples. Preserve all requested components and relationships. Save editable architecture.stack. Check the installed CLI version/help, then check, format, and render architecture.svg locally. Read warnings as well as exit status, fix errors without removing requirements, and inspect the SVG if a viewer is available. Do not invent syntax or provider icon IDs. Report artifact paths, CLI version, and any validation gaps. Ask before installation or third-party terms acceptance when not already authorized.
```

## 로컬 검증

[시작하기](./getting-started)에서 CLI를 설치하고 미출시 main 기능 대신 실제 바이너리의 버전과 도움말을 확인하세요. CLI 0.4.0의 check/render는 `--json`을 지원하지 않습니다.

```sh
$ stack --version
$ stack help
$ stack check architecture.stack
$ stack fmt architecture.stack
$ stack check architecture.stack
$ stack render architecture.stack -o architecture.svg
```

## 아이콘과 제한

제공자 아이콘 ID를 추측하거나 제삼자 약관을 자동으로 수락하지 마세요. 팩이 없으면 의미에 맞는 kind를 사용하고 브랜드 아이콘이 표시되지 않았음을 알리세요. CLI 또는 뷰어를 사용할 수 없으면 미검증 범위를 보고하세요. 컴파일 성공이 읽기 쉬운 배치를 보장하지는 않습니다.

## 레퍼런스와 업데이트

- [Examples](../examples/index)
- [Syntax](../language/syntax)
- [Diagnostics](../reference/diagnostics-and-limits)
- [Provider icons](./provider-icons)
- [Markdown index](https://stack-diagram.com/docs/llms.txt)
