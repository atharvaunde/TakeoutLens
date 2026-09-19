"use client"

import Link from "next/link"
import { DownloadIcon, FileIcon, FolderIcon, ImageIcon, VideoIcon } from "lucide-react"

import type { DriveRow } from "@/columns/drive-files.column"
import { MediaLightbox } from "@/components/common/media-lightbox"
import { Button } from "@/components/ui/button"

const ICONS = { image: ImageIcon, video: VideoIcon, other: FileIcon } as const

/** Folder -> navigate; image/video -> lightbox; anything else -> download. */
export function DriveNameCell({ row }: { row: DriveRow }) {
  if (row.kind === "folder") {
    return (
      <Link href={`/drive?path=${encodeURIComponent(row.folderPath)}`} className="flex items-center gap-2 font-medium hover:underline">
        <FolderIcon className="size-4 shrink-0" />
        <span className="truncate">{row.name}</span>
      </Link>
    )
  }
  const Icon = ICONS[row.fileKind]
  if (row.fileKind !== "other" && row.fileId !== null) {
    return (
      <MediaLightbox fileId={row.fileId} name={row.name} kind={row.fileKind}>
        <button type="button" className="flex items-center gap-2 text-left hover:underline">
          <Icon className="size-4 shrink-0" />
          <span className="truncate">{row.name}</span>
        </button>
      </MediaLightbox>
    )
  }
  return (
    <div className="flex items-center gap-2">
      <Icon className="size-4 shrink-0" />
      <span className="truncate">{row.name}</span>
      {row.fileId !== null ? (
        <Button asChild variant="ghost" size="icon-sm" aria-label={`Download ${row.name}`}>
          <a href={`/download/${row.fileId}`} download>
            <DownloadIcon />
          </a>
        </Button>
      ) : null}
    </div>
  )
}
