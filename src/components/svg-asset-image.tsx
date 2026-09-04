import { useLayoutEffect, useRef } from "react"

type SvgAssetImageProps = Omit<React.ComponentProps<"img">, "alt" | "src"> & {
  alt: string
  svg: string
}

export function SvgAssetImage({ alt, svg, ...props }: SvgAssetImageProps) {
  const imageRef = useRef<HTMLImageElement>(null)

  useLayoutEffect(() => {
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }))
    if (imageRef.current) imageRef.current.src = url
    return () => URL.revokeObjectURL(url)
  }, [svg])

  return <img alt={alt} ref={imageRef} {...props} />
}
