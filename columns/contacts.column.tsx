"use client"

import { createColumnHelper } from "@tanstack/react-table"

import type { DataTableFeatures } from "@/components/data-table/features"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { getInitials } from "@/lib/helper"

export interface ContactRow {
  id: string
  name: string
  email: string
  phone: string
  org: string
  address: string
  note: string
  birthday: string
  photoId: number | null
  isMine: boolean
  isStarred: boolean
}

const helper = createColumnHelper<DataTableFeatures, ContactRow>()

export const contactColumns = helper.columns([
  helper.accessor("name", {
    header: "Name",
    cell: (info) => (
      <div className="flex items-center gap-3">
        <Avatar>
          {info.row.original.photoId ? <AvatarImage src={`/thumb/${info.row.original.photoId}`} alt="" /> : null}
          <AvatarFallback>{getInitials(info.getValue())}</AvatarFallback>
        </Avatar>
        <span className="font-medium">{info.getValue()}</span>
        {info.row.original.isStarred ? <Badge variant="secondary">★</Badge> : null}
      </div>
    ),
  }),
  helper.accessor("email", { header: "Email", cell: (info) => <span className="block max-w-72 truncate">{info.getValue()}</span> }),
  helper.accessor("phone", { header: "Phone", enableSorting: false }),
  helper.accessor("org", { header: "Organization" }),
])
