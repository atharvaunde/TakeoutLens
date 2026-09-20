import { cn } from "@/lib/utils"

export type ProductKind = "docs" | "sheets" | "slides" | "pdf"

const EXT_TO_PRODUCT: Readonly<Record<string, ProductKind>> = {
  ".doc": "docs", ".docx": "docs", ".odt": "docs", ".rtf": "docs",
  ".xls": "sheets", ".xlsx": "sheets", ".ods": "sheets", ".csv": "sheets",
  ".ppt": "slides", ".pptx": "slides", ".odp": "slides",
  ".pdf": "pdf",
}

const TONE: Record<ProductKind, string> = {
  docs: "text-gp-docs",
  sheets: "text-gp-sheets",
  slides: "text-gp-slides",
  pdf: "text-gp-pdf",
}

export function getProductKind(fileName: string): ProductKind | null {
  const dot = fileName.lastIndexOf(".")
  return dot === -1 ? null : (EXT_TO_PRODUCT[fileName.slice(dot).toLowerCase()] ?? null)
}

/** Page glyph with a folded corner; `children` are the white marks drawn on it. */
function Page({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-4 flex-none", className)} aria-hidden="true">
      <path d="M6 2h8l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" fill="currentColor" />
      <path d="M14 2v4a1 1 0 0 0 1 1h4Z" fill="currentColor" opacity=".45" />
      <g className="stroke-surf" strokeWidth="1.6" strokeLinecap="round" fill="none">
        {children}
      </g>
    </svg>
  )
}

/** Simple product-style file icons (own drawings, coloured by design tokens) for Docs / Sheets / Slides / PDF files. */
export function ProductIcon({ kind, className }: { kind: ProductKind; className?: string }) {
  const tone = cn(className, TONE[kind]) // product colour wins over a generic text colour passed in
  switch (kind) {
    case "docs":
      return (
        <Page className={tone}>
          <path d="M8 12h8M8 15h8M8 18h5" />
        </Page>
      )
    case "sheets":
      return (
        <Page className={tone}>
          <path d="M8 11h8v7H8ZM8 14.5h8M12 11v7" />
        </Page>
      )
    case "slides":
      return (
        <Page className={tone}>
          <path d="M8 12h8v5H8Z" />
        </Page>
      )
    case "pdf":
      return (
        <Page className={tone}>
          <path d="M8 17c2-1 3-3 3-5s-1-2-1 0 2 4 5 4" />
        </Page>
      )
  }
}
