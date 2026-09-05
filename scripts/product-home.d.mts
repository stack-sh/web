export interface ProductHome {
  description: string
  hero: {
    name: "Stack"
    tagline: string
    image?: { light: string; dark: string; alt: string }
    actions: Array<{ theme?: string; text: string; link: string }>
  }
  features: Array<{ title: string; details: string }>
}

export function readProductHome(source: string): ProductHome
export function productHomeMarkdown(copy: ProductHome): string
export function renderProductMetadata(html: string, copy: ProductHome): string
export function validateBuiltProductHome(html: string, copy: ProductHome): void
