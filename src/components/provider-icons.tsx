import { useRef, useState } from "react"
import { Check, Copy, ExternalLink, PackageOpen, Trash2, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { SvgAssetImage } from "@/components/svg-asset-image"
import { loadProviderPackFiles, type LoadedProviderPack } from "@/lib/provider-pack"

interface ProviderIconsProps {
  disabled: boolean
  packs: readonly LoadedProviderPack[]
  onImport: (pack: LoadedProviderPack) => void
  onRemove: (providerId: string) => void
}

export function ProviderIcons({ disabled, packs, onImport, onRemove }: ProviderIconsProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [copiedIcon, setCopiedIcon] = useState<string | null>(null)

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return
    setError(null)
    setIsImporting(true)
    try {
      onImport(await loadProviderPackFiles(files))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "The provider pack could not load.")
    } finally {
      setIsImporting(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  async function copyIcon(iconId: string) {
    try {
      await navigator.clipboard.writeText(`icon "${iconId}"`)
      setCopiedIcon(iconId)
      setError(null)
    } catch {
      setCopiedIcon(null)
      setError("Could not copy the icon syntax. Select the ID and copy it manually.")
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          aria-label="Provider icons"
          className="size-7 px-0 sm:w-auto sm:pr-2.5 sm:pl-1.5"
          disabled={disabled}
          size="sm"
          variant="outline"
        >
          <PackageOpen aria-hidden="true" />
          <span className="hidden sm:inline">Icons</span>
          {packs.length > 0 ? (
            <span className="border-l pl-1.5 font-mono text-[0.6875rem]">{packs.length}</span>
          ) : null}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100svh-2rem)] grid-rows-[auto_auto_1fr] overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="border-b px-4 py-3 pr-12 sm:px-5">
          <DialogTitle>Provider icons</DialogTitle>
          <DialogDescription>
            Load a CLI-created pack into this tab. Files stay in your browser and are never
            uploaded.
          </DialogDescription>
        </DialogHeader>

        <div className="border-b px-4 py-3 sm:px-5">
          <input
            accept=".json,.svg,application/json,image/svg+xml"
            aria-label="Provider pack files"
            className="sr-only"
            multiple
            onChange={(event) => void handleFiles(event.currentTarget.files)}
            ref={inputRef}
            type="file"
          />
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-medium">Import one local pack</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Select its <code>manifest.json</code> and every declared SVG in <code>assets/</code>
                .
              </p>
            </div>
            <Button
              disabled={disabled || isImporting}
              onClick={() => inputRef.current?.click()}
              size="sm"
            >
              <Upload aria-hidden="true" data-icon="inline-start" />
              {isImporting ? "Importing…" : "Choose files"}
            </Button>
          </div>
          {error ? (
            <p className="mt-3 text-xs leading-5 text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <div className="min-h-0 overflow-y-auto px-4 py-4 sm:px-5">
          {packs.length === 0 ? (
            <div className="flex min-h-48 flex-col items-center justify-center border border-dashed p-5 text-center">
              <PackageOpen aria-hidden="true" className="mb-3 size-6 text-muted-foreground" />
              <p className="text-sm font-medium">No local provider packs</p>
              <p className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">
                Core icons remain available without a pack. AWS, Google Cloud, and Azure artwork is
                user-imported so Stack does not redistribute vendor assets.
              </p>
              <a
                className="mt-3 inline-flex items-center gap-1 rounded-sm text-xs underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                href="/docs/guide/provider-icons"
                target="_blank"
              >
                Import guide
                <ExternalLink aria-hidden="true" className="size-3" />
              </a>
            </div>
          ) : (
            <div className="space-y-5">
              {packs.map((pack) => (
                <section aria-labelledby={`provider-${pack.providerId}`} key={pack.providerId}>
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-medium" id={`provider-${pack.providerId}`}>
                        {pack.providerName}
                      </h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {pack.sourceRelease} · pack {pack.packVersion} · {pack.icons.length} icons
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Review terms again after {pack.reviewAfter}.{" "}
                        <a
                          className="rounded-sm underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                          href={pack.sourcePageUrl}
                          rel="noreferrer"
                          target="_blank"
                        >
                          Source
                        </a>{" "}
                        ·{" "}
                        <a
                          className="rounded-sm underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                          href={pack.termsUrl}
                          rel="noreferrer"
                          target="_blank"
                        >
                          Terms
                        </a>
                      </p>
                    </div>
                    <Button
                      aria-label={`Remove ${pack.providerName}`}
                      onClick={() => onRemove(pack.providerId)}
                      size="icon-sm"
                      variant="ghost"
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </div>
                  <ul className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
                    {pack.icons.map((icon) => (
                      <li className="bg-background" key={icon.id}>
                        <button
                          className="flex min-h-24 w-full items-center gap-3 p-3 text-left outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                          onClick={() => void copyIcon(icon.id)}
                          type="button"
                        >
                          <LocalIconPreview productName={icon.productName} svg={icon.svg} />
                          <span className="min-w-0 flex-1">
                            <span className="block text-xs font-medium">{icon.productName}</span>
                            <span className="mt-1 block font-mono text-[0.6875rem] text-muted-foreground">
                              {icon.id}
                            </span>
                          </span>
                          {copiedIcon === icon.id ? (
                            <Check aria-label="Copied" className="size-3.5 shrink-0" />
                          ) : (
                            <Copy
                              aria-label="Copy syntax"
                              className="size-3.5 shrink-0 text-muted-foreground"
                            />
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function LocalIconPreview({ svg, productName }: { svg: string; productName: string }) {
  return (
    <span className="flex size-12 shrink-0 items-center justify-center border bg-white p-1.5">
      <SvgAssetImage alt={`${productName} icon`} className="max-h-full max-w-full" svg={svg} />
    </span>
  )
}

export default ProviderIcons
