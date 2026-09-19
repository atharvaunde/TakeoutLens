"use client"

import { useState } from "react"

import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface MediaLightboxProps {
  fileId: number
  name: string
  kind: "image" | "video"
  children: React.ReactNode
}

/** Preview an image or video from /media (Range-capable). Only mounts the media element while open. */
export function MediaLightbox({ fileId, name, kind, children }: MediaLightboxProps) {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-5xl">
        <DialogTitle className="truncate">{name}</DialogTitle>
        <DialogDescription className="sr-only">Preview of {name}</DialogDescription>
        {open ? (
          kind === "video" ? (
            <video src={`/media/${fileId}`} controls autoPlay className="max-h-[75vh] w-full rounded-md bg-black" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- streamed from the local media route, not an optimizable remote image
            <img src={`/media/${fileId}`} alt={name} className="max-h-[75vh] w-full rounded-md object-contain" />
          )
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
