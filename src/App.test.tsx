import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

const engine = vi.hoisted(() => ({
  check: vi.fn(),
  checkWithProviderPacks: vi.fn(),
  format: vi.fn(),
  initialize: vi.fn(),
  render: vi.fn(),
  renderWithProviderPacks: vi.fn(),
}))

vi.mock("@stack-sh/engine", () => ({
  check: engine.check,
  checkWithProviderPacks: engine.checkWithProviderPacks,
  default: engine.initialize,
  format: engine.format,
  render: engine.render,
  renderWithProviderPacks: engine.renderWithProviderPacks,
}))

import App from "./App"

function fileAt(path: string, contents: string, type?: string): File {
  const file = new File([contents], path.split("/").at(-1) ?? path, { type })
  Object.defineProperty(file, "webkitRelativePath", { value: path })
  return file
}

const metadata = {
  engineVersion: "0.6.0",
  languageVersion: { major: 1, minor: 0 },
  themeCatalogRevision: "sha256:test",
  themeCatalogVersion: "0.4.0",
}

const diagnostic = {
  code: "STK2001",
  expected: [],
  help: "Add the missing closing brace.",
  message: "The diagram is not closed.",
  range: {
    end: { byteOffset: 10, column: 11, line: 1 },
    start: { byteOffset: 10, column: 11, line: 1 },
  },
  related: [],
  severity: "error",
} as const

describe("Stack Playground", () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove("dark")
    document.documentElement.style.colorScheme = ""
    engine.initialize.mockResolvedValue({})
    engine.check.mockReturnValue({ diagnostics: [], metadata })
    engine.checkWithProviderPacks.mockReturnValue({ diagnostics: [], metadata })
    engine.format.mockReturnValue({ diagnostics: [], formattedSource: "stack 1.0\n", metadata })
    engine.render.mockReturnValue({
      diagnostics: [],
      metadata,
      providerNotices: [],
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" />',
    })
    engine.renderWithProviderPacks.mockReturnValue({
      diagnostics: [],
      metadata,
      providerNotices: [
        {
          archiveSha256: "sha256:test",
          attribution: "AWS icons are owned by Amazon Web Services.",
          icons: [{ id: "aws:s3", productName: "Amazon S3", sourceId: "primary" }],
          nonEndorsement: "AWS does not endorse Stack.",
          packRevision: "sha256:pack",
          packVersion: "0.1.0",
          providerId: "aws",
          providerName: "Amazon Web Services",
          sourceRelease: "fixture-1",
          sources: [
            {
              archiveSha256: "sha256:test",
              id: "primary",
              pageUrl: "https://example.com/icons",
              release: "fixture-1",
              termsUrl: "https://example.com/terms",
            },
          ],
          termsSummary: "Use in architecture diagrams.",
          termsUrl: "https://example.com/terms",
        },
      ],
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" />',
    })
  })

  it("loads the engine and renders the initial source", async () => {
    render(<App />)

    expect(screen.getByRole("textbox", { name: "Stack source" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Stack" }).querySelector("img")).toHaveAttribute(
      "src",
      "/favicon.svg",
    )
    expect(screen.getByRole("link", { name: "Docs" })).toHaveAttribute("href", "/docs/")
    expect(await screen.findByAltText("Rendered Stack architecture diagram")).toBeInTheDocument()
    expect(screen.getByText("Render completed")).toBeInTheDocument()
    expect(engine.render).toHaveBeenCalledOnce()
    expect(engine.render).toHaveBeenCalledWith(expect.stringContaining('icon "web"'))
    expect(engine.render).toHaveBeenCalledWith(expect.stringContaining('icon "gateway"'))
  })

  it("formats the source and refreshes the preview", async () => {
    const user = userEvent.setup()
    render(<App />)
    await screen.findByAltText("Rendered Stack architecture diagram")

    await user.click(screen.getByRole("button", { name: "Format" }))

    expect(screen.getByRole("textbox", { name: "Stack source" })).toHaveValue("stack 1.0\n")
    expect(engine.render).toHaveBeenLastCalledWith("stack 1.0\n")
    expect(screen.getByText("Format completed")).toBeInTheDocument()
  })

  it("shows validation diagnostics from Check", async () => {
    const user = userEvent.setup()
    engine.check.mockReturnValueOnce({ diagnostics: [diagnostic], metadata })
    render(<App />)
    await screen.findByAltText("Rendered Stack architecture diagram")

    await user.click(screen.getByRole("button", { name: "Check" }))

    await waitFor(() => expect(screen.getByText("[STK2001]")).toBeInTheDocument())
    expect(screen.getByText("The diagram is not closed.")).toBeInTheDocument()
    expect(screen.getByText("Check found errors")).toBeInTheDocument()
  })

  it("shows actionable guidance and selects the diagnostic source range", async () => {
    const user = userEvent.setup()
    const source =
      'stack 1.0\ndiagram "Example" {\n  node app "App"\n  layout { direction hoo }\n}\n'
    engine.check.mockReturnValueOnce({
      diagnostics: [
        {
          code: "STK2002",
          expected: ["right", "down"],
          help: "Use 'right' for horizontal flow or 'down' for vertical flow.",
          message: "Unknown layout direction 'hoo'.",
          range: {
            end: { byteOffset: 71, column: 25, line: 4 },
            start: { byteOffset: 68, column: 22, line: 4 },
          },
          related: [
            {
              message: "The diagram starts here.",
              range: {
                end: { byteOffset: 17, column: 8, line: 2 },
                start: { byteOffset: 10, column: 1, line: 2 },
              },
            },
          ],
          severity: "error",
        },
      ],
      metadata,
    })
    render(<App />)
    await screen.findByAltText("Rendered Stack architecture diagram")

    const editor = screen.getByRole<HTMLTextAreaElement>("textbox", { name: "Stack source" })
    fireEvent.change(editor, { target: { value: source } })
    await user.click(screen.getByRole("button", { name: "Check" }))

    expect(screen.getByText("Unknown layout direction 'hoo'.")).toBeInTheDocument()
    expect(screen.getByText("right")).toBeInTheDocument()
    expect(screen.getByText("down")).toBeInTheDocument()
    expect(screen.getByText(/Use 'right' for horizontal flow/)).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Go to error STK2002 at 4:22" }))
    expect(editor).toHaveFocus()
    expect(editor.selectionStart).toBe(68)
    expect(editor.selectionEnd).toBe(71)

    await user.click(screen.getByRole("button", { name: "The diagram starts here. at 2:1" }))
    expect(editor.selectionStart).toBe(10)
    expect(editor.selectionEnd).toBe(17)

    fireEvent.change(editor, { target: { value: source.replace("hoo", "right") } })
    expect(screen.queryByText("[STK2002]")).not.toBeInTheDocument()
    expect(screen.getByText("Source changed")).toBeInTheDocument()
  })

  it("switches color mode and remembers the choice", async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole("button", { name: "Switch to dark mode" }))

    expect(document.documentElement).toHaveClass("dark")
    expect(document.documentElement.style.colorScheme).toBe("dark")
    expect(localStorage.getItem("stack-color-mode")).toBe("dark")
    expect(screen.getByRole("button", { name: "Switch to light mode" })).toBeInTheDocument()
  })

  it("opens the rendered diagram in an accessible dialog", async () => {
    const user = userEvent.setup()
    render(<App />)
    await screen.findByAltText("Rendered Stack architecture diagram")

    await user.click(screen.getByRole("button", { name: "Expand rendered diagram" }))

    expect(screen.getByRole("dialog", { name: "Rendered diagram" })).toBeInTheDocument()
    expect(screen.getByAltText("Expanded Stack architecture diagram")).toBeInTheDocument()

    await user.keyboard("{Escape}")
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Expand rendered diagram" })).toHaveFocus()
  })

  it("loads a provider icon store and renders with every known pack", async () => {
    const user = userEvent.setup()
    render(<App />)
    await screen.findByAltText("Rendered Stack architecture diagram")

    await user.click(await screen.findByRole("button", { name: "Provider icons" }))

    const awsManifest = fileAt(
      "icons/aws/manifest.json",
      JSON.stringify({
        packVersion: "0.1.0",
        provider: { id: "aws", name: "Amazon Web Services" },
        source: {
          pageUrl: "https://example.com/icons",
          release: "fixture-1",
          reviewAfter: "2026-12-03",
          termsUrl: "https://example.com/terms",
        },
        icons: [
          {
            asset: { path: "assets/s3.svg" },
            id: "aws:s3",
            productName: "Amazon Simple Storage Service (Amazon S3)",
          },
        ],
      }),
      "application/json",
    )
    const awsAsset = fileAt(
      "icons/aws/assets/s3.svg",
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" />',
      "image/svg+xml",
    )
    const simpleIconsManifest = fileAt(
      "icons/simple-icons/manifest.json",
      JSON.stringify({
        packVersion: "0.1.0",
        provider: { id: "simple-icons", name: "Simple Icons" },
        source: {
          pageUrl: "https://example.com/simple-icons",
          release: "fixture-1",
          reviewAfter: "2026-12-03",
          termsUrl: "https://example.com/simple-icons/terms",
        },
        icons: [
          {
            asset: { path: "assets/github.svg" },
            id: "simple-icons:github",
            productName: "GitHub",
          },
        ],
      }),
      "application/json",
    )
    const simpleIconsAsset = fileAt(
      "icons/simple-icons/assets/github.svg",
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" />',
      "image/svg+xml",
    )

    await user.upload(screen.getByLabelText("Provider icon store folder"), [
      awsManifest,
      awsAsset,
      simpleIconsManifest,
      simpleIconsAsset,
    ])

    expect(await screen.findByText("Amazon Web Services")).toBeInTheDocument()
    expect(screen.getByText("Simple Icons")).toBeInTheDocument()
    expect(screen.getByText("aws:s3")).toBeInTheDocument()
    expect(screen.getByText("simple-icons:github")).toBeInTheDocument()
    expect(
      screen.getByAltText("Amazon Simple Storage Service (Amazon S3) icon"),
    ).toBeInTheDocument()
    expect(engine.checkWithProviderPacks).toHaveBeenCalledTimes(2)
    expect(engine.renderWithProviderPacks).toHaveBeenCalledOnce()
    expect(engine.renderWithProviderPacks.mock.calls[0][1]).toHaveLength(2)
    await user.click(screen.getByRole("button", { name: "Close" }))
    expect(screen.getByRole("button", { name: "Notice" })).toBeInTheDocument()
  })

  it("shows an icon store error before sending provider files to the engine", async () => {
    const user = userEvent.setup()
    render(<App />)
    await screen.findByAltText("Rendered Stack architecture diagram")
    await user.click(await screen.findByRole("button", { name: "Provider icons" }))

    await user.upload(
      screen.getByLabelText("Provider icon store folder"),
      fileAt("icons/aws/manifest.json", "not json", "application/json"),
    )

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Provider manifest is not valid JSON",
    )
    expect(engine.renderWithProviderPacks).not.toHaveBeenCalled()
  })
})
