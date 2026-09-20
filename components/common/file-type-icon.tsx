import { createElement } from "react"
import { FolderIcon } from "lucide-react"

import { getFileIcon } from "@/lib/helper"
import { getProductKind, ProductIcon } from "./product-icon"

interface FileTypeIconProps {
  name: string
  isFolder?: boolean
  className?: string
}

/** Icon for a file: Docs/Sheets/Slides/PDF glyphs for those types, otherwise a generic type icon (folders too). */
export function FileTypeIcon({ name, isFolder = false, className }: FileTypeIconProps) {
  const product = isFolder ? null : getProductKind(name)
  if (product) return <ProductIcon kind={product} className={className} />
  return createElement(isFolder ? FolderIcon : getFileIcon(name), { className })
}
