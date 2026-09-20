"use client"

import { useEffect, useState } from "react"

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { formatAperture, formatBytes, formatCoordinates, formatDateTime, formatExposure, formatNumber } from "@/lib/helper"
import type { PhotoInfo } from "@/lib/types"
import { cn } from "@/lib/utils"
import { loadPhotoInfoAction } from "@/server/actions/photos"

export interface PhotoTarget {
  fileId: number
  name: string
}

const LABEL = "font-mono text-[10px] tracking-[.1em] text-faint uppercase"

const Row = ({ label, value }: { label: string; value: React.ReactNode }) =>
  value === null || value === "—" || value === "" ? null : (
    <div className="grid grid-cols-[92px_1fr] gap-2 py-[3px] text-[12.5px]">
      <span className={`${LABEL} pt-0.5`}>{label}</span>
      <span className="min-w-0 break-words text-ink2">{value}</span>
    </div>
  )

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="border-b border-line2 pb-3 last:border-b-0">
    <div className="mb-1 border-b border-line2 pb-1.5 font-mono text-[10px] tracking-[.14em] text-faint uppercase">{title}</div>
    {children}
  </div>
)

/** Full-size photo with an Info panel: dates, dimensions, camera/EXIF, location and Google Photos details. */
export function PhotoViewer({ target, onClose }: { target: PhotoTarget | null; onClose: () => void }) {
  const [info, setInfo] = useState<PhotoInfo | null>(null)
  const [loadedId, setLoadedId] = useState<number | null>(null)
  const [showInfo, setShowInfo] = useState(true)

  useEffect(() => {
    if (!target) return
    let cancelled = false
    void loadPhotoInfoAction(target.fileId).then((result) => {
      if (cancelled) return
      setInfo(result)
      setLoadedId(target.fileId)
    })
    return () => {
      cancelled = true
    }
  }, [target])

  const ready = target !== null && loadedId === target.fileId && info !== null
  const dimensions = ready && info.width && info.height ? `${formatNumber(info.width)} × ${formatNumber(info.height)}${info.width * info.height >= 1e6 ? ` · ${(info.width * info.height / 1e6).toFixed(1)} MP` : ""}` : null
  const exposure = ready ? [formatExposure(info.exposureSeconds), formatAperture(info.aperture), info.iso ? `ISO ${info.iso}` : null].filter((v) => v && v !== "—").join(" · ") : ""

  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[94vw] gap-3 sm:max-w-[min(1500px,94vw)]">
        {target ? (
          <>
            <div className="flex items-center gap-3 pr-8">
              <DialogTitle className="min-w-0 flex-1 truncate">{target.name}</DialogTitle>
              <button
                type="button"
                onClick={() => setShowInfo((v) => !v)}
                aria-pressed={showInfo}
                className={cn("cursor-pointer rounded-[7px] border border-line px-2.5 py-1 text-xs font-medium hover:bg-hov", showInfo ? "bg-sel text-ink" : "bg-surf text-mute")}
              >
                Info
              </button>
            </div>
            <DialogDescription className="sr-only">Photo preview and details for {target.name}</DialogDescription>
            <div className={cn("grid min-h-0 gap-4", showInfo ? "grid-cols-[minmax(0,1fr)_300px]" : "grid-cols-1")}>
              {/* eslint-disable-next-line @next/next/no-img-element -- streamed from the local media route, not an optimizable remote image */}
              <img src={`/media/${target.fileId}`} alt={target.name} className="max-h-[80vh] w-full rounded-md bg-panel object-contain" />
              {showInfo ? (
                <div className="max-h-[80vh] overflow-y-auto pr-1">
                  {ready ? (
                    <div className="flex flex-col gap-3">
                      <Section title="Details">
                        <Row label="Taken" value={info.takenAt ? formatDateTime(info.takenAt) : null} />
                        <Row label="Uploaded" value={info.uploadedAt ? formatDateTime(info.uploadedAt) : null} />
                        <Row label="Dimensions" value={dimensions} />
                        <Row label="File" value={`${formatBytes(info.sizeBytes)}${info.format ? ` · ${info.format.toUpperCase()}` : ""}`} />
                        <Row label="Description" value={info.description} />
                      </Section>
                      {info.camera || info.lens || exposure || info.focalLengthMm || info.software ? (
                        <Section title="Camera">
                          <Row label="Camera" value={info.camera} />
                          <Row label="Lens" value={info.lens} />
                          <Row label="Exposure" value={exposure} />
                          <Row label="Focal length" value={info.focalLengthMm ? `${Number(info.focalLengthMm.toFixed(1))} mm` : null} />
                          <Row label="Software" value={info.software} />
                        </Section>
                      ) : null}
                      {info.latitude !== null && info.longitude !== null ? (
                        <Section title="Location">
                          <Row label="GPS" value={formatCoordinates(info.latitude, info.longitude)} />
                        </Section>
                      ) : null}
                      <Section title="Google Photos">
                        <Row label="Views" value={info.views !== null ? formatNumber(info.views) : null} />
                        <Row label="Origin" value={info.origin ? info.origin.replace(/([A-Z])/g, " $1").toLowerCase() : null} />
                        {info.googleUrl ? (
                          <Row
                            label="Link"
                            value={
                              <a href={info.googleUrl} target="_blank" rel="noreferrer noopener" className="text-acc hover:underline">
                                Open in Google Photos
                              </a>
                            }
                          />
                        ) : null}
                      </Section>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <Skeleton className="h-3 w-1/3" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
