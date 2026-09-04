export const documentationContract = {
  locales: ["ja", "zh", "ko"],
  allowedFenceLanguages: ["stack", "sh", "text", "yaml"],
  navigation: [
    {
      label: "guide",
      items: [
        { label: "introduction", page: "guide/what-is-stack.md" },
        { label: "gettingStarted", page: "guide/getting-started.md" },
        { label: "playground", page: "guide/playground.md" },
        { label: "providerIcons", page: "guide/provider-icons.md" },
      ],
    },
    {
      label: "language",
      items: [
        { label: "syntax", page: "language/syntax.md" },
        { label: "nodesAndGroups", page: "language/nodes-and-groups.md" },
        { label: "edgesAndLayout", page: "language/edges-and-layout.md" },
        { label: "themesAndIcons", page: "language/themes-and-icons.md" },
        { label: "formatting", page: "language/formatting.md" },
      ],
    },
    {
      label: "reference",
      items: [
        { label: "diagnosticsAndLimits", page: "reference/diagnostics-and-limits.md" },
        { label: "versioningAndSafety", page: "reference/versioning-and-safety.md" },
      ],
    },
  ],
  cli: {
    repository: "stack-sh/cli",
    revision: "04c47eca36e4a54be83604a8a4f3fb89d135507d",
    version: "0.3.0",
    executionExceptions: [
      {
        prefix: "stack icons import ",
        reason:
          "Import downloads provider archives and records terms acceptance; CI validates its real help contract without performing the side effect.",
      },
    ],
  },
  stackExecutionExceptions: [
    {
      page: "language/edges-and-layout.md",
      block: 1,
      reason: "This block is an intentionally isolated group-local layout fragment.",
    },
  ],
  exceptions: {
    pageParity: [],
    headingParity: [],
    codeBlockParity: [],
    links: [],
  },
}
