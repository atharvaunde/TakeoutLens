"use client"

import { useMemo } from "react"

import { buildCsvColumns } from "@/columns/generic-csv.column"
import { DataTable } from "@/components/data-table/data-table"
import type { CsvRowData } from "@/lib/types"

interface CsvViewerProps {
  headers: string[]
  rows: CsvRowData[]
  total: number
  /** Columns whose values are masked until revealed (saved passwords). */
  secretHeaders: string[]
}

export function CsvViewer({ headers, rows, total, secretHeaders }: CsvViewerProps) {
  const columns = useMemo(() => buildCsvColumns(headers, secretHeaders), [headers, secretHeaders])
  return <DataTable columns={columns} data={rows} rowCount={total} rowIdKey="__id" searchable searchPlaceholder="Search this file…" emptyTitle="No rows" />
}
