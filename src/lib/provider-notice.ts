import type { ProviderNotice } from "@stack-sh/engine"

export function providerNoticeMarkdown(notices: readonly ProviderNotice[]): string {
  let output = "# Stack provider icon notices\n"

  for (const notice of notices) {
    output += `\n## ${notice.providerName} (\`${notice.providerId}\`)\n`
    output += `\nPack: \`${notice.packVersion}\` (\`${notice.packRevision}\`)\n`
    output += `\n${notice.attribution}\n\n${notice.termsSummary}\n\n${notice.nonEndorsement}\n`
    output += "\n### Sources\n"
    for (const source of notice.sources) {
      output += `\n- \`${source.id}\` — ${source.release}\n`
      output += `  - Source: <${source.pageUrl}>\n`
      output += `  - Archive SHA-256: \`${source.archiveSha256}\`\n`
      output += `  - Terms: <${source.termsUrl}>\n`
    }
    output += "\n### Used icons\n"
    for (const icon of notice.icons) {
      output += `\n- \`${icon.id}\` — ${icon.productName} (source \`${icon.sourceId}\`)`
      if (icon.brandSourceUrl) output += `\n  - Brand source: <${icon.brandSourceUrl}>`
      if (icon.brandGuidelinesUrl) {
        output += `\n  - Brand guidelines: <${icon.brandGuidelinesUrl}>`
      }
    }
    output += "\n"
  }

  return output
}
