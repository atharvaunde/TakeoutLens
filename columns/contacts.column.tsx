"use client"

import { createColumnHelper } from "@tanstack/react-table"

import type { DataTableFeatures } from "@/components/data-table/features"

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
const dash = (value: string) => value || "—"

export const contactColumns = helper.columns([
  helper.accessor("name", { header: "Name", cell: (info) => <span className="text-[13px] text-ink">{info.getValue()}</span> }),
  helper.accessor("email", { header: "Email", cell: (info) => <span className="block max-w-96 truncate font-mono text-[11.5px] text-mute">{dash(info.getValue())}</span> }),
  helper.accessor("phone", { header: "Phone", enableSorting: false, cell: (info) => <span className="font-mono text-[11.5px] text-mute">{dash(info.getValue())}</span> }),
  helper.accessor("org", { header: "Organization", cell: (info) => <span className="text-xs text-faint">{dash(info.getValue())}</span> }),
])
