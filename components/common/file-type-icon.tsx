import { createElement } from "react"
import { FolderIcon } from "lucide-react"

import { getFileIcon } from "@/lib/helper"

interface FileTypeIconProps {
  name: string
  isFolder?: boolean
  className?: string
}

/** Icon for a file (by extension) or folder. Single place that resolves the icon component. */
export function FileTypeIcon({ name, isFolder = false, className }: FileTypeIconProps) {
  return createElement(isFolder ? FolderIcon : getFileIcon(name), { className })
}
