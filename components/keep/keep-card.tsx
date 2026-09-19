import { CheckSquareIcon, PinIcon, SquareIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { KEEP } from "@/lib/constant"
import { formatDate } from "@/lib/helper"
import type { KeepNote } from "@/lib/types"

export function KeepCard({ note }: { note: KeepNote }) {
  return (
    <Card className="break-inside-avoid" style={{ backgroundColor: KEEP.colors[note.color] ?? KEEP.colors.DEFAULT }}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="wrap-break-word">{note.title || (note.items.length ? "List" : "Note")}</CardTitle>
          {note.pinned ? <PinIcon className="size-4 shrink-0 text-muted-foreground" /> : null}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        {note.text ? <p className="whitespace-pre-wrap wrap-break-word">{note.text}</p> : null}
        {note.items.length ? (
          <ul className="flex flex-col gap-1">
            {note.items.map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                {item.checked ? <CheckSquareIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" /> : <SquareIcon className="mt-0.5 size-4 shrink-0" />}
                <span className={item.checked ? "text-muted-foreground line-through" : undefined}>{item.text}</span>
              </li>
            ))}
          </ul>
        ) : null}
        {note.attachmentIds.map((id) => (
          // eslint-disable-next-line @next/next/no-img-element -- cached local thumbnail
          <img key={id} src={`/thumb/${id}`} alt="" loading="lazy" className="rounded-md" />
        ))}
        <div className="flex flex-wrap items-center gap-1">
          {note.labels.map((label) => (
            <Badge key={label} variant="secondary">
              {label}
            </Badge>
          ))}
          <span className="ml-auto text-xs text-muted-foreground">{formatDate(note.editedAt)}</span>
        </div>
      </CardContent>
    </Card>
  )
}
