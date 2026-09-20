"use client"

import { TABLE_PARAMS } from "@/lib/constant"
import { DataTablePagination } from "./data-table-pagination"
import { useTableUrlState } from "./use-table-url-state"

const NO_FILTERS: never[] = []

/** Pager for non-table lists: reads/writes `page` and `pageSize` in the URL. */
export function UrlPagination({ rowCount, compact = false }: { rowCount: number; compact?: boolean }) {
  const { params, update } = useTableUrlState(NO_FILTERS)
  return (
    <DataTablePagination
      compact={compact}
      page={params.page}
      pageSize={params.pageSize}
      pageCount={Math.max(Math.ceil(rowCount / params.pageSize), 1)}
      rowCount={rowCount}
      onPageChange={(page) => update({ [TABLE_PARAMS.page]: String(page) }, true)}
      onPageSizeChange={(size) => update({ [TABLE_PARAMS.pageSize]: String(size) })}
    />
  )
}
