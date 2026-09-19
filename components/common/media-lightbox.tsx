"use client"

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"

export interface MediaTarget {
  fileId: number
  name: string
  kind: "image" | "video"
}

interface MediaLightboxProps {
  target: MediaTarget | null
  onClose: () => void
}

/** Controlled preview of an image or video from /media (Range-capable). Media mounts only while open. */
export function MediaLightbox({ target, onClose }: MediaLightboxProps) {
  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl">
        {target ? (
          <>
            <DialogTitle className="truncate">{target.name}</DialogTitle>
            <DialogDescription className="sr-only">Preview of {target.name}</DialogDescription>
            {target.kind === "video" ? (
              <video src={`/media/${target.fileId}`} controls autoPlay className="max-h-[75vh] w-full rounded-md bg-black" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- streamed from the local media route, not an optimizable remote image
              <img src={`/media/${target.fileId}`} alt={target.name} className="max-h-[75vh] w-full rounded-md object-contain" />
            )}
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
