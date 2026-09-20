"use client"

import { useRef, useState } from "react"

import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FILTER_ALL_VALUE, SEARCH, TABLE_PARAMS, TABLE_TEXT, type TableFilterDefinition } from "@/lib/constant"

interface DataTableToolbarProps {
  search: string
  searchPlaceholder?: string
  filters: readonly TableFilterDefinition[]
  filterValues: Record<string, string>
  onChange: (changes: Record<string, string | null>) => void
  /** Extra controls aligned to the right (e.g. a view toggle). */
  end?: React.ReactNode
  /** Hide the search box (when the page header provides one). */
  noSearch?: boolean
}

/** Search box + filter dropdowns, in the design's compact input style. */
export function DataTableToolbar({ search, searchPlaceholder = TABLE_TEXT.searchPlaceholder, filters, filterValues, onChange, end, noSearch = false }: DataTableToolbarProps) {
  // Uncontrolled input: typing is debounced into the URL; `resetKey` remounts it after "Clear".
  const [resetKey, setResetKey] = useState(0)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const handleSearch = (value: string) => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => onChange({ [TABLE_PARAMS.search]: value.trim() || null }), SEARCH.debounceMs)
  }
  const hasActive = Boolean(search) || Object.keys(filterValues).length > 0

  return (
    <div className="flex flex-wrap items-center gap-2">
      {noSearch ? null : (
        <input
          key={resetKey}
          defaultValue={search}
          placeholder={searchPlaceholder}
          onChange={(event) => handleSearch(event.target.value)}
          className="h-[27px] w-[250px] rounded-[7px] border border-line bg-surf px-[9px] text-xs text-ink outline-none focus:border-acc"
        />
      )}
      {filters.map((filter) => (
        <Select
          key={filter.id}
          value={filterValues[filter.id] ?? FILTER_ALL_VALUE}
          onValueChange={(value) => onChange({ [filter.id]: value === FILTER_ALL_VALUE ? null : value })}
        >
          <SelectTrigger size="sm" className="h-[27px] w-40 rounded-[7px] border-line bg-surf text-xs">
            <SelectValue placeholder={filter.label} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value={FILTER_ALL_VALUE}>
                {filter.label}: {TABLE_TEXT.allOption}
              </SelectItem>
              {filter.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      ))}
      {hasActive ? (
        <button
          type="button"
          onClick={() => {
            clearTimeout(timer.current)
            setResetKey((key) => key + 1)
            onChange({ [TABLE_PARAMS.search]: null, ...Object.fromEntries(filters.map((filter) => [filter.id, null])) })
          }}
          className="cursor-pointer text-[11.5px] font-medium text-acc hover:underline"
        >
          {TABLE_TEXT.clearFilters}
        </button>
      ) : null}
      {end ? <div className="ml-auto flex items-center gap-2">{end}</div> : null}
    </div>
  )
}
