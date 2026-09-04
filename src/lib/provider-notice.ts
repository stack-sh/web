import type { ProviderNotice } from "@stack-sh/engine"

export function providerNoticeMarkdown(notices: readonly ProviderNotice[]): string {
  let output = "# Stack provider icon notices\n"

  for (const notice of notices) {
    output += `\n## ${notice.providerName} (\`${notice.providerId}\`)\n`
    output += `\nPack: \`${notice.packVersion}\` (\`${notice.packRevision}\`)\n`
    output += `\nSource release: ${notice.sourceRelease}\n`
    output += `\nArchive SHA-256: \`${notice.archiveSha256}\`\n`
    output += `\nTerms: <${notice.termsUrl}>\n`
    output += `\n${notice.attribution}\n\n${notice.termsSummary}\n\n${notice.nonEndorsement}\n`
    output += "\n### Used icons\n"
    for (const icon of notice.icons) {
      output += `\n- \`${icon.id}\` — ${icon.productName}`
    }
    output += "\n"
  }

  return output
}
