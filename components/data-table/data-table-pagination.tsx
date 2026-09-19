"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
}

export function DataTablePagination({
  page,
  pageSize,
  pageCount,
  rowCount,
  pageSizeOptions = PAGINATION.pageSizeOptions,
  onPageChange,
  onPageSizeChange,
}: DataTablePaginationProps) {
  const lastPage = Math.max(pageCount, 1)

  const submitJump = (value: string) => {
    const target = Number.parseInt(value, 10)
    if (!Number.isNaN(target) && target !== page) onPageChange(Math.min(Math.max(target, 1), lastPage))
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
      <span>{formatNumber(rowCount)} total</span>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span>{TABLE_TEXT.rowsPerPage}</span>
          <Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}>
            <SelectTrigger size="sm" className="w-20">
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
          className="flex items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            submitJump(new FormData(event.currentTarget).get("page")?.toString() ?? "")
          }}
        >
          <label htmlFor="table-jump-to-page">{TABLE_TEXT.jumpToPage}</label>
          <Input
            key={page}
            id="table-jump-to-page"
            name="page"
            type="number"
            min={1}
            max={lastPage}
            defaultValue={page}
            className="h-8 w-20"
            onBlur={(event) => submitJump(event.target.value)}
          />
          <span>/ {formatNumber(lastPage)}</span>
        </form>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
            {TABLE_TEXT.previous}
          </Button>
          <Button variant="outline" size="sm" disabled={page >= lastPage} onClick={() => onPageChange(page + 1)}>
            {TABLE_TEXT.next}
          </Button>
        </div>
      </div>
    </div>
  )
}
