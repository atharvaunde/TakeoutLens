"use client"

import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PAGINATION, TABLE_TEXT } from "@/lib/constant"
import { formatNumber } from "@/lib/helper"

interface DataTablePaginationProps {
  page: number
  pageSize: number
  pageCount: number
  rowCount: number
  pageSizeOptions?: readonly number[]
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  /** Hide the rows-per-page and jump controls (narrow lists). */
  compact?: boolean
}

const button = "cursor-pointer rounded border border-line px-2 py-[3px] hover:bg-hov disabled:cursor-default disabled:opacity-50 disabled:hover:bg-transparent"

/** Mono pager: "50 of 3,593 · rows · go to page · Previous / Next". */
export function DataTablePagination({
  page,
  pageSize,
  pageCount,
  rowCount,
  pageSizeOptions = PAGINATION.pageSizeOptions,
  onPageChange,
  onPageSizeChange,
  compact = false,
}: DataTablePaginationProps) {
  const lastPage = Math.max(pageCount, 1)
  const shown = Math.min(pageSize, Math.max(rowCount - (page - 1) * pageSize, 0))
  const submitJump = (value: string) => {
    const target = Number.parseInt(value, 10)
    if (!Number.isNaN(target) && target !== page) onPageChange(Math.min(Math.max(target, 1), lastPage))
  }

  return (
    <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-faint">
      <span>
        {formatNumber(shown)} of {formatNumber(rowCount)}
      </span>
      <span className="flex-1" />
      {compact ? null : (
        <>
          <div className="flex items-center gap-1.5">
            <span>{TABLE_TEXT.rowsPerPage}</span>
            <Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}>
              <SelectTrigger size="sm" className="h-6 w-[62px] rounded border-line font-mono text-[11px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {pageSizeOptions.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <form
            className="flex items-center gap-1.5"
            onSubmit={(event) => {
              event.preventDefault()
              submitJump(new FormData(event.currentTarget).get("page")?.toString() ?? "")
            }}
          >
            <label htmlFor="table-jump-to-page">{TABLE_TEXT.jumpToPage}</label>
            <input
              key={page}
              id="table-jump-to-page"
              name="page"
              type="number"
              min={1}
              max={lastPage}
              defaultValue={page}
              onBlur={(event) => submitJump(event.target.value)}
              className="h-6 w-14 rounded border border-line bg-background px-1.5 text-center text-ink outline-none focus:border-acc"
            />
            <span>/ {formatNumber(lastPage)}</span>
          </form>
        </>
      )}
      <button type="button" className={button} disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        {TABLE_TEXT.previous}
      </button>
      <button type="button" className={`${button} text-ink2`} disabled={page >= lastPage} onClick={() => onPageChange(page + 1)}>
        {TABLE_TEXT.next}
      </button>
    </div>
  )
}
