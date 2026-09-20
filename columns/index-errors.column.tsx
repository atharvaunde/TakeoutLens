"use client"

import { createColumnHelper } from "@tanstack/react-table"

import type { DataTableFeatures } from "@/components/data-table/features"
import { formatDateTime } from "@/lib/helper"

export interface IndexErrorRow {
  id: string
  module: string
  path: string
  reason: string
  occurredAt: string
}

const helper = createColumnHelper<DataTableFeatures, IndexErrorRow>()

export const indexErrorColumns = helper.columns([
  helper.accessor("module", { header: "Module" }),
  helper.accessor("path", { header: "File", enableSorting: false }),
  helper.accessor("reason", { header: "Reason", enableSorting: false }),
  helper.accessor("occurredAt", { header: "When", cell: (info) => <span className="font-mono text-[11.5px] text-mute">{formatDateTime(info.getValue())}</span> }),
])
