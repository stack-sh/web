import { mkdir, readFile, writeFile } from "node:fs/promises"
import { createRequire } from "node:module"
import path from "node:path"

import { defineConfig } from "vitepress"
import type { LanguageRegistration } from "@shikijs/core"
import type { DefaultTheme } from "vitepress"

const require = createRequire(import.meta.url)
const stackGrammar = require("@stack-sh/language/grammar") as LanguageRegistration
const siteOrigin = "https://stack-diagram.com"
const siteDescription = "Write your Technical Stack, Get beautiful diagram"
const socialImageUrl = `${siteOrigin}/ogp.png`
const documentationHomeMarkdown: Record<string, string> = {
  "index.md": `# Stack Documentation

Stack is a declarative language for writing static software-architecture and technical-stack diagrams as concise, reviewable source.

- [Getting started](./guide/getting-started.md)
- [Language reference](./language/syntax.md)
- [Diagnostics and limits](./reference/diagnostics-and-limits.md)
`,
  "ja/index.md": `# Stackドキュメント

Stackは、静的なsoftware architecture diagramとtechnical stack diagramを簡潔でreview可能なsourceとして記述するための宣言的言語です。

- [はじめる](./guide/getting-started.md)
- [言語リファレンス](./language/syntax.md)
- [Diagnosticとlimit](./reference/diagnostics-and-limits.md)
`,
  "zh/index.md": `# Stack 文档

Stack 是一种声明式语言，用简洁、可审查的源代码编写静态软件架构图和技术栈图。

- [快速开始](./guide/getting-started.md)
- [语言参考](./language/syntax.md)
- [诊断与限制](./reference/diagnostics-and-limits.md)
`,
  "ko/index.md": `# Stack 문서

Stack은 정적 소프트웨어 아키텍처 및 기술 스택 다이어그램을 간결하고 검토 가능한 소스로 작성하는 선언적 언어입니다.

- [시작하기](./guide/getting-started.md)
- [언어 레퍼런스](./language/syntax.md)
- [진단과 제한](./reference/diagnostics-and-limits.md)
`,
}

function agentMarkdown(relativePath: string, source: string): string {
  const content = source.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "").trim()
  return `${content || documentationHomeMarkdown[relativePath] || ""}\n`
}

function documentationUrl(relativePath: string): string {
  const route = relativePath.replace(/index\.md$/, "").replace(/\.md$/, "")
  return `${siteOrigin}/docs/${route}`
}

function openGraphLocale(relativePath: string): string {
  if (relativePath.startsWith("ja/")) return "ja_JP"
  if (relativePath.startsWith("zh/")) return "zh_CN"
  if (relativePath.startsWith("ko/")) return "ko_KR"
  return "en_US"
}

type Labels = {
  guide: string
  introduction: string
  gettingStarted: string
  playground: string
  language: string
  syntax: string
  nodesAndGroups: string
  edgesAndLayout: string
  themesAndIcons: string
  formatting: string
  reference: string
  diagnosticsAndLimits: string
  versioningAndSafety: string
  edit: string
  outline: string
  previous: string
  next: string
  appearance: string
  lightMode: string
  darkMode: string
  menu: string
  returnToTop: string
  changeLanguage: string
  skipToContent: string
}

function sidebar(prefix: string, labels: Labels): DefaultTheme.SidebarItem[] {
  return [
    {
      text: labels.guide,
      items: [
        { text: labels.introduction, link: `${prefix}/guide/what-is-stack` },
        { text: labels.gettingStarted, link: `${prefix}/guide/getting-started` },
        { text: labels.playground, link: `${prefix}/guide/playground` },
      ],
    },
    {
      text: labels.language,
      items: [
        { text: labels.syntax, link: `${prefix}/language/syntax` },
        { text: labels.nodesAndGroups, link: `${prefix}/language/nodes-and-groups` },
        { text: labels.edgesAndLayout, link: `${prefix}/language/edges-and-layout` },
        { text: labels.themesAndIcons, link: `${prefix}/language/themes-and-icons` },
        { text: labels.formatting, link: `${prefix}/language/formatting` },
      ],
    },
    {
      text: labels.reference,
      items: [
        {
          text: labels.diagnosticsAndLimits,
          link: `${prefix}/reference/diagnostics-and-limits`,
        },
        {
          text: labels.versioningAndSafety,
          link: `${prefix}/reference/versioning-and-safety`,
        },
      ],
    },
  ]
}

function localeTheme(prefix: string, labels: Labels): DefaultTheme.Config {
  return {
    nav: [
      { text: labels.guide, link: `${prefix}/guide/getting-started` },
      { text: labels.reference, link: `${prefix}/reference/diagnostics-and-limits` },
      { text: "Playground", link: "https://stack-diagram.com/", target: "_self" },
    ],
    sidebar: sidebar(prefix, labels),
    editLink: {
      pattern: "https://github.com/stack-sh/web/edit/main/docs/:path",
      text: labels.edit,
    },
    outline: { level: [2, 3], label: labels.outline },
    docFooter: { prev: labels.previous, next: labels.next },
    darkModeSwitchLabel: labels.appearance,
    lightModeSwitchTitle: labels.lightMode,
    darkModeSwitchTitle: labels.darkMode,
    sidebarMenuLabel: labels.menu,
    returnToTopLabel: labels.returnToTop,
    langMenuLabel: labels.changeLanguage,
    skipToContentLabel: labels.skipToContent,
  }
}

const en: Labels = {
  guide: "Guide",
  introduction: "What is Stack?",
  gettingStarted: "Getting started",
  playground: "Using the Playground",
  language: "Language",
  syntax: "Document and syntax",
  nodesAndGroups: "Nodes and groups",
  edgesAndLayout: "Edges and layout",
  themesAndIcons: "Themes and icons",
  formatting: "Canonical formatting",
  reference: "Reference",
  diagnosticsAndLimits: "Diagnostics and limits",
  versioningAndSafety: "Versioning and safety",
  edit: "Edit this page on GitHub",
  outline: "On this page",
  previous: "Previous page",
  next: "Next page",
  appearance: "Appearance",
  lightMode: "Switch to light theme",
  darkMode: "Switch to dark theme",
  menu: "Menu",
  returnToTop: "Return to top",
  changeLanguage: "Change language",
  skipToContent: "Skip to content",
}

const ja: Labels = {
  guide: "ガイド",
  introduction: "Stackとは",
  gettingStarted: "はじめる",
  playground: "Playgroundの使い方",
  language: "言語",
  syntax: "Documentとsyntax",
  nodesAndGroups: "Nodeとgroup",
  edgesAndLayout: "Edgeとlayout",
  themesAndIcons: "Themeとicon",
  formatting: "Canonical formatting",
  reference: "リファレンス",
  diagnosticsAndLimits: "Diagnosticとlimit",
  versioningAndSafety: "Versioningと安全性",
  edit: "GitHubでこのページを編集",
  outline: "このページ",
  previous: "前のページ",
  next: "次のページ",
  appearance: "表示",
  lightMode: "ライトテーマに切り替える",
  darkMode: "ダークテーマに切り替える",
  menu: "メニュー",
  returnToTop: "ページ上部へ戻る",
  changeLanguage: "言語を変更",
  skipToContent: "本文へ移動",
}

const zh: Labels = {
  guide: "指南",
  introduction: "什么是 Stack？",
  gettingStarted: "快速开始",
  playground: "使用 Playground",
  language: "语言",
  syntax: "文档与语法",
  nodesAndGroups: "节点与分组",
  edgesAndLayout: "连线与布局",
  themesAndIcons: "主题与图标",
  formatting: "规范格式化",
  reference: "参考",
  diagnosticsAndLimits: "诊断与限制",
  versioningAndSafety: "版本与安全",
  edit: "在 GitHub 上编辑此页",
  outline: "本页内容",
  previous: "上一页",
  next: "下一页",
  appearance: "外观",
  lightMode: "切换到浅色主题",
  darkMode: "切换到深色主题",
  menu: "菜单",
  returnToTop: "返回顶部",
  changeLanguage: "切换语言",
  skipToContent: "跳到正文",
}

const ko: Labels = {
  guide: "가이드",
  introduction: "Stack이란?",
  gettingStarted: "시작하기",
  playground: "Playground 사용법",
  language: "언어",
  syntax: "문서와 문법",
  nodesAndGroups: "노드와 그룹",
  edgesAndLayout: "엣지와 레이아웃",
  themesAndIcons: "테마와 아이콘",
  formatting: "표준 포매팅",
  reference: "레퍼런스",
  diagnosticsAndLimits: "진단과 제한",
  versioningAndSafety: "버전과 안전성",
  edit: "GitHub에서 이 페이지 편집",
  outline: "이 페이지에서",
  previous: "이전 페이지",
  next: "다음 페이지",
  appearance: "화면 모드",
  lightMode: "라이트 테마로 전환",
  darkMode: "다크 테마로 전환",
  menu: "메뉴",
  returnToTop: "맨 위로",
  changeLanguage: "언어 변경",
  skipToContent: "본문으로 이동",
}

export default defineConfig({
  base: "/docs/",
  outDir: "../dist/docs",
  cleanUrls: true,
  lastUpdated: true,
  sitemap: { hostname: "https://stack-diagram.com/docs/" },
  transformHtml(code, id) {
    if (!id.endsWith("index.html")) return code

    return code.replace('<div class="VPContent', '<div role="main" class="VPContent')
  },
  transformHead({ pageData, title, description }) {
    if (pageData.isNotFound || !pageData.relativePath) return

    const canonicalUrl = documentationUrl(pageData.relativePath)
    const markdownUrl = `/docs/${pageData.relativePath}`

    return [
      ["link", { rel: "canonical", href: canonicalUrl }],
      ["link", { rel: "alternate", type: "text/markdown", href: markdownUrl }],
      ["link", { rel: "describedby", href: "/docs/llms.txt" }],
      ["meta", { name: "robots", content: "index, follow, max-image-preview:large" }],
      ["meta", { property: "og:type", content: "article" }],
      ["meta", { property: "og:site_name", content: "Stack" }],
      ["meta", { property: "og:title", content: title }],
      ["meta", { property: "og:description", content: description }],
      ["meta", { property: "og:url", content: canonicalUrl }],
      ["meta", { property: "og:image", content: socialImageUrl }],
      ["meta", { property: "og:image:type", content: "image/png" }],
      ["meta", { property: "og:image:width", content: "1200" }],
      ["meta", { property: "og:image:height", content: "630" }],
      ["meta", { property: "og:image:alt", content: "Stack" }],
      ["meta", { property: "og:locale", content: openGraphLocale(pageData.relativePath) }],
      ["meta", { name: "twitter:card", content: "summary_large_image" }],
      ["meta", { name: "twitter:title", content: title }],
      ["meta", { name: "twitter:description", content: description }],
      ["meta", { name: "twitter:image", content: socialImageUrl }],
      ["meta", { name: "twitter:image:alt", content: "Stack" }],
    ]
  },
  async buildEnd(siteConfig) {
    const englishPages: Array<{ relativePath: string; source: string }> = []

    for (const relativePath of siteConfig.pages) {
      const source = agentMarkdown(
        relativePath,
        await readFile(path.join(siteConfig.srcDir, relativePath), "utf8"),
      )
      const destination = path.join(siteConfig.outDir, relativePath)
      await mkdir(path.dirname(destination), { recursive: true })
      await writeFile(destination, source)

      if (!/^(ja|zh|ko)\//.test(relativePath)) {
        englishPages.push({ relativePath, source })
      }
    }

    const completeDocumentation = [
      "# Stack",
      "",
      `> ${siteDescription}`,
      "",
      "This file contains the complete English Stack documentation for agents that prefer one document. The curated entry point is https://stack-diagram.com/llms.txt.",
      ...englishPages
        .sort((left, right) => left.relativePath.localeCompare(right.relativePath))
        .flatMap(({ relativePath, source }) => [
          "",
          "---",
          "",
          `Source: ${siteOrigin}/docs/${relativePath}`,
          "",
          source.trim(),
        ]),
      "",
    ].join("\n")

    await writeFile(path.join(siteConfig.outDir, "..", "llms-full.txt"), completeDocumentation)
  },
  head: [
    ["link", { rel: "icon", href: "/docs/favicon.svg", type: "image/svg+xml" }],
    ["meta", { name: "theme-color", content: "#ffffff" }],
  ],
  locales: {
    root: {
      label: "English",
      lang: "en-US",
      title: "Stack",
      description: "Write architecture diagrams as concise, reviewable source.",
      themeConfig: localeTheme("", en),
    },
    ja: {
      label: "日本語",
      lang: "ja-JP",
      title: "Stack",
      description: "Architecture diagramを簡潔でreview可能なsourceとして記述します。",
      themeConfig: localeTheme("/ja", ja),
      markdown: {
        container: { infoLabel: "情報", tipLabel: "ヒント", warningLabel: "警告" },
        codeCopyButton: { tooltipText: "コードをコピー", copiedText: "コピーしました" },
      },
    },
    zh: {
      label: "简体中文",
      lang: "zh-CN",
      title: "Stack",
      description: "用简洁、可审查的源代码编写架构图。",
      themeConfig: localeTheme("/zh", zh),
      markdown: {
        container: { infoLabel: "信息", tipLabel: "提示", warningLabel: "警告" },
        codeCopyButton: { tooltipText: "复制代码", copiedText: "已复制" },
      },
    },
    ko: {
      label: "한국어",
      lang: "ko-KR",
      title: "Stack",
      description: "아키텍처 다이어그램을 간결하고 검토 가능한 소스로 작성합니다.",
      themeConfig: localeTheme("/ko", ko),
      markdown: {
        container: { infoLabel: "정보", tipLabel: "팁", warningLabel: "경고" },
        codeCopyButton: { tooltipText: "코드 복사", copiedText: "복사됨" },
      },
    },
  },
  markdown: {
    languages: [stackGrammar],
    theme: { light: "github-light", dark: "github-dark" },
  },
  themeConfig: {
    logo: {
      light: "/favicon.svg",
      dark: "/favicon.svg",
      alt: "Stack",
    },
    i18nRouting: true,
    externalLinkIcon: true,
    socialLinks: [{ icon: "github", link: "https://github.com/stack-sh" }],
    search: {
      provider: "local",
      options: {
        locales: {
          ja: {
            translations: {
              button: { buttonText: "検索", buttonAriaLabel: "ドキュメントを検索" },
              modal: {
                displayDetails: "詳細を表示",
                resetButtonTitle: "検索をリセット",
                backButtonTitle: "検索を閉じる",
                noResultsText: "結果が見つかりません",
                footer: {
                  selectText: "選択",
                  selectKeyAriaLabel: "Enter",
                  navigateText: "移動",
                  navigateUpKeyAriaLabel: "上矢印",
                  navigateDownKeyAriaLabel: "下矢印",
                  closeText: "閉じる",
                  closeKeyAriaLabel: "Escape",
                },
              },
            },
          },
          zh: {
            translations: {
              button: { buttonText: "搜索", buttonAriaLabel: "搜索文档" },
              modal: {
                displayDetails: "显示详情",
                resetButtonTitle: "重置搜索",
                backButtonTitle: "关闭搜索",
                noResultsText: "未找到结果",
                footer: {
                  selectText: "选择",
                  selectKeyAriaLabel: "回车",
                  navigateText: "导航",
                  navigateUpKeyAriaLabel: "向上箭头",
                  navigateDownKeyAriaLabel: "向下箭头",
                  closeText: "关闭",
                  closeKeyAriaLabel: "Escape",
                },
              },
            },
          },
          ko: {
            translations: {
              button: { buttonText: "검색", buttonAriaLabel: "문서 검색" },
              modal: {
                displayDetails: "상세 보기",
                resetButtonTitle: "검색 초기화",
                backButtonTitle: "검색 닫기",
                noResultsText: "결과를 찾을 수 없습니다",
                footer: {
                  selectText: "선택",
                  selectKeyAriaLabel: "Enter",
                  navigateText: "이동",
                  navigateUpKeyAriaLabel: "위쪽 화살표",
                  navigateDownKeyAriaLabel: "아래쪽 화살표",
                  closeText: "닫기",
                  closeKeyAriaLabel: "Escape",
                },
              },
            },
          },
        },
      },
    },
  },
})
