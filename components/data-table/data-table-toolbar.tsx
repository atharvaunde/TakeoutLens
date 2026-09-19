"use client"

import { useRef, useState } from "react"
import { SearchIcon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
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
}

export function DataTableToolbar({
  search,
  searchPlaceholder = TABLE_TEXT.searchPlaceholder,
  filters,
  filterValues,
  onChange,
  end,
}: DataTableToolbarProps) {
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
      <InputGroup className="w-72">
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput
          key={resetKey}
          defaultValue={search}
          placeholder={searchPlaceholder}
          onChange={(event) => handleSearch(event.target.value)}
        />
      </InputGroup>
      {filters.map((filter) => (
        <Select
          key={filter.id}
          value={filterValues[filter.id] ?? FILTER_ALL_VALUE}
          onValueChange={(value) => onChange({ [filter.id]: value === FILTER_ALL_VALUE ? null : value })}
        >
          <SelectTrigger className="w-44">
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
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            clearTimeout(timer.current)
            setResetKey((key) => key + 1)
            onChange({
              [TABLE_PARAMS.search]: null,
              ...Object.fromEntries(filters.map((filter) => [filter.id, null])),
            })
          }}
        >
          <XIcon data-icon="inline-start" />
          {TABLE_TEXT.clearFilters}
        </Button>
      ) : null}
      {end ? <div className="ml-auto flex items-center gap-2">{end}</div> : null}
    </div>
  )
}
