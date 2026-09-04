import { existsSync } from "node:fs"
import { readdir, readFile } from "node:fs/promises"
import path from "node:path"

function relativePath(root, target) {
  return path.relative(root, target).split(path.sep).join("/")
}

async function markdownFiles(root, directory = root) {
  const files = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === ".vitepress" || entry.name === "public") continue
    const absolute = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...(await markdownFiles(root, absolute)))
    if (entry.isFile() && entry.name.endsWith(".md")) files.push(relativePath(root, absolute))
  }
  return files.sort()
}

function exceptionKey(kind, exception) {
  if (kind === "links") return `${kind}:${exception.page}:${exception.target}`
  if (kind === "pageParity") return `${kind}:${exception.locale}:${exception.page}`
  return `${kind}:${exception.locale}:${exception.page}`
}

function prepareExceptions(exceptions) {
  const configured = new Map()
  for (const kind of ["pageParity", "headingParity", "codeBlockParity", "links"]) {
    for (const exception of exceptions[kind] ?? []) {
      if (typeof exception.reason !== "string" || exception.reason.trim().length === 0) {
        throw new Error(`${kind} exception requires a non-empty reason`)
      }
      const key = exceptionKey(kind, exception)
      if (configured.has(key)) throw new Error(`Duplicate documentation exception: ${key}`)
      configured.set(key, exception)
    }
  }
  return configured
}

function consumeException(configured, used, kind, values) {
  const key = exceptionKey(kind, values)
  if (!configured.has(key)) return false
  used.add(key)
  return true
}

function headingSlug(title) {
  return title
    .replace(/\s+\{#[A-Za-z0-9_-]+\}\s*$/, "")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/<[^>]+>/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{Letter}\p{Number}\p{Mark}_-]/gu, "")
}

export function parseMarkdown(page, source, allowedFenceLanguages) {
  const headings = []
  const headingIds = new Set()
  const slugCounts = new Map()
  const codeBlocks = []
  const links = []
  let fence

  for (const [lineIndex, line] of source.split(/\r?\n/).entries()) {
    const lineNumber = lineIndex + 1
    if (fence) {
      if (/^ {0,3}```\s*$/.test(line)) {
        const body = fence.lines.join("\n").trimEnd()
        if (body.length === 0) throw new Error(`${page}:${fence.line} has an empty code block`)
        codeBlocks.push({ language: fence.language, body, line: fence.line })
        fence = undefined
      } else {
        fence.lines.push(line)
      }
      continue
    }

    const openingFence = line.match(/^ {0,3}```([A-Za-z0-9_-]+)\s*$/)
    if (openingFence) {
      const language = openingFence[1]
      if (!allowedFenceLanguages.includes(language)) {
        throw new Error(`${page}:${lineNumber} uses unsupported code fence '${language}'`)
      }
      fence = { language, line: lineNumber, lines: [] }
      continue
    }
    if (/^ {0,3}```/.test(line)) {
      throw new Error(`${page}:${lineNumber} has a malformed or unlabelled code fence`)
    }

    const heading = line.match(/^ {0,3}(#{1,6})\s+(.+?)\s*#*\s*$/)
    if (heading) {
      const explicitId = heading[2].match(/\s+\{#([A-Za-z0-9_-]+)\}\s*$/)?.[1]
      const baseId = explicitId ?? headingSlug(heading[2])
      const duplicateIndex = slugCounts.get(baseId) ?? 0
      const id = duplicateIndex === 0 ? baseId : `${baseId}-${duplicateIndex}`
      slugCounts.set(baseId, duplicateIndex + 1)
      headings.push(heading[1].length)
      headingIds.add(id)
    }

    let parsedLinkCount = 0
    for (const match of line.matchAll(/!?\[[^\]]*\]\((<[^>]+>|[^\s)]+)(?:\s+["'][^"']*["'])?\)/g)) {
      parsedLinkCount += 1
      links.push({ target: match[1].replace(/^<|>$/g, ""), line: lineNumber })
    }
    const apparentLinkCount = line.match(/\]\(/g)?.length ?? 0
    if (parsedLinkCount !== apparentLinkCount) {
      throw new Error(`${page}:${lineNumber} has malformed Markdown link syntax`)
    }
  }

  if (fence) throw new Error(`${page}:${fence.line} has an unclosed code fence`)
  return { headings, headingIds, codeBlocks, links }
}

export function shellCommands(page, codeBlock) {
  const commands = []
  let pending = ""

  for (const [lineIndex, line] of codeBlock.body.split("\n").entries()) {
    if (line.trim().length === 0) continue
    if (pending.length === 0) {
      if (!line.startsWith("$ ")) {
        throw new Error(
          `${page}:${codeBlock.line + lineIndex + 1} must start a shell example with '$ '`,
        )
      }
      pending = line.slice(2).trim()
    } else {
      if (!/^\s+/.test(line)) {
        throw new Error(`${page}:${codeBlock.line + lineIndex + 1} has an invalid continuation`)
      }
      pending += ` ${line.trim()}`
    }

    if (pending.endsWith("\\")) {
      pending = pending.slice(0, -1).trimEnd()
      continue
    }
    if (!pending.startsWith("stack ")) {
      throw new Error(`${page}:${codeBlock.line + lineIndex + 1} is not a Stack CLI example`)
    }
    commands.push(pending)
    pending = ""
  }

  if (pending.length > 0) throw new Error(`${page}:${codeBlock.line} has an unclosed continuation`)
  return commands
}

function markdownCandidates(page, target) {
  const pageDirectory = path.posix.dirname(page)
  const joined = target.startsWith("/")
    ? target.replace(/^\/docs\/?/, "").replace(/^\//, "")
    : path.posix.join(pageDirectory, target)
  const normalized = path.posix.normalize(joined)
  if (path.posix.extname(normalized)) return [normalized]
  return [normalized, `${normalized}.md`, path.posix.join(normalized, "index.md")]
}

function validateLink({ docsRoot, documents, page, link, configuredExceptions, usedExceptions }) {
  const [rawPath, rawAnchor] = link.target.split("#", 2)
  if (/^[A-Za-z][A-Za-z+.-]*:/.test(rawPath)) {
    let url
    try {
      url = new URL(link.target)
    } catch {
      throw new Error(`${page}:${link.line} has an invalid external link: ${link.target}`)
    }
    if (url.protocol !== "https:" || url.username || url.password) {
      throw new Error(`${page}:${link.line} must use a credential-free HTTPS link: ${link.target}`)
    }
    return
  }

  let decodedPath
  let decodedAnchor
  try {
    decodedPath = decodeURIComponent(rawPath)
    decodedAnchor = rawAnchor === undefined ? undefined : decodeURIComponent(rawAnchor)
  } catch {
    throw new Error(`${page}:${link.line} has invalid percent encoding: ${link.target}`)
  }
  if (rawAnchor !== undefined && decodedAnchor.length === 0) {
    throw new Error(`${page}:${link.line} has an empty anchor: ${link.target}`)
  }

  const candidates = decodedPath.length === 0 ? [page] : markdownCandidates(page, decodedPath)
  const destination = candidates.find((candidate) => documents.has(candidate))
  if (!destination) {
    const resolvedDocsRoot = path.resolve(docsRoot)
    const resolvedPublicRoot = path.resolve(docsRoot, "public")
    const isInside = (root, candidate) =>
      candidate === root || candidate.startsWith(`${root}${path.sep}`)
    const assetExists = candidates.some((candidate) => {
      const absolute = path.resolve(docsRoot, candidate)
      const publicAsset = path.resolve(docsRoot, "public", candidate.replace(/^\//, ""))
      return (
        (isInside(resolvedDocsRoot, absolute) && existsSync(absolute)) ||
        (isInside(resolvedPublicRoot, publicAsset) && existsSync(publicAsset))
      )
    })
    if (assetExists) return
    if (
      consumeException(configuredExceptions, usedExceptions, "links", {
        page,
        target: link.target,
      })
    ) {
      return
    }
    throw new Error(`${page}:${link.line} links to missing target ${link.target}`)
  }

  if (decodedAnchor && !documents.get(destination).headingIds.has(decodedAnchor)) {
    if (
      consumeException(configuredExceptions, usedExceptions, "links", {
        page,
        target: link.target,
      })
    ) {
      return
    }
    throw new Error(`${page}:${link.line} links to missing anchor ${link.target}`)
  }
}

export async function validateDocumentationContract({
  docsRoot,
  locales,
  allowedFenceLanguages,
  navigationPages,
  exceptions = {},
}) {
  const configuredExceptions = prepareExceptions(exceptions)
  const usedExceptions = new Set()
  const files = await markdownFiles(docsRoot)
  const localePrefixes = locales.map((locale) => `${locale}/`)
  const pages = files.filter((file) => !localePrefixes.some((prefix) => file.startsWith(prefix)))
  if (!pages.includes("index.md")) throw new Error("English documentation is missing index.md")
  const expectedNavigation = pages.filter((page) => page !== "index.md")
  const actualNavigation = [...navigationPages].sort()
  if (new Set(actualNavigation).size !== actualNavigation.length) {
    throw new Error("Documentation navigation contains a duplicate page")
  }
  if (JSON.stringify(actualNavigation) !== JSON.stringify(expectedNavigation)) {
    throw new Error("Documentation navigation does not match the English page inventory")
  }

  const sources = new Map()
  const documents = new Map()
  for (const file of files) {
    const source = await readFile(path.join(docsRoot, file), "utf8")
    sources.set(file, source)
    documents.set(file, parseMarkdown(file, source, allowedFenceLanguages))
  }

  for (const locale of locales) {
    const translatedPages = files
      .filter((file) => file.startsWith(`${locale}/`))
      .map((file) => file.slice(locale.length + 1))
    for (const page of new Set([...pages, ...translatedPages])) {
      if (pages.includes(page) === translatedPages.includes(page)) continue
      if (consumeException(configuredExceptions, usedExceptions, "pageParity", { locale, page })) {
        continue
      }
      throw new Error(`${locale}/${page} does not match the English page inventory`)
    }

    for (const page of pages.filter((candidate) => translatedPages.includes(candidate))) {
      const english = documents.get(page)
      const translated = documents.get(`${locale}/${page}`)
      if (JSON.stringify(english.headings) !== JSON.stringify(translated.headings)) {
        if (
          !consumeException(configuredExceptions, usedExceptions, "headingParity", { locale, page })
        ) {
          throw new Error(`${locale}/${page} does not preserve the English heading structure`)
        }
      }
      const englishCode = english.codeBlocks.map(({ language, body }) => ({ language, body }))
      const translatedCode = translated.codeBlocks.map(({ language, body }) => ({ language, body }))
      if (JSON.stringify(englishCode) !== JSON.stringify(translatedCode)) {
        if (
          !consumeException(configuredExceptions, usedExceptions, "codeBlockParity", {
            locale,
            page,
          })
        ) {
          throw new Error(`${locale}/${page} does not preserve the canonical code examples`)
        }
      }
    }
  }

  for (const [page, document] of documents) {
    for (const link of document.links) {
      validateLink({ docsRoot, documents, page, link, configuredExceptions, usedExceptions })
    }
  }

  const unusedExceptions = [...configuredExceptions.keys()].filter(
    (key) => !usedExceptions.has(key),
  )
  if (unusedExceptions.length > 0) {
    throw new Error(`Unused documentation exceptions: ${unusedExceptions.join(", ")}`)
  }

  const englishPages = new Map(pages.map((page) => [page, sources.get(page)]))
  const cliExamples = []
  for (const page of pages) {
    for (const codeBlock of documents.get(page).codeBlocks) {
      if (codeBlock.language === "sh") cliExamples.push(...shellCommands(page, codeBlock))
    }
  }

  return { pages, englishPages, documents, cliExamples }
}
