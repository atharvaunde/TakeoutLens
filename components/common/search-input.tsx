"use client"

import { useRef, useState, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { SearchIcon } from "lucide-react"

import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { SEARCH, TABLE_PARAMS } from "@/lib/constant"

interface SearchInputProps {
  placeholder?: string
  /** URL param holding the query (default `q`). */
  param?: string
  /** Params removed whenever the query changes (e.g. paging or a selected item). */
  resetParams?: readonly string[]
  className?: string
}

/** Debounced search box that stores its query in the URL so the server page renders the results. */
export function SearchInput({ placeholder = "Search…", param = TABLE_PARAMS.search, resetParams = [], className }: SearchInputProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const [initial] = useState(() => searchParams.get(param) ?? "")
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const push = (value: string) => {
    const next = new URLSearchParams(searchParams.toString())
    if (value) next.set(param, value)
    else next.delete(param)
    for (const key of resetParams) next.delete(key)
    const query = next.toString()
    startTransition(() => router.push(query ? `${pathname}?${query}` : pathname))
  }

  return (
    <InputGroup className={className}>
      <InputGroupAddon>
        <SearchIcon />
      </InputGroupAddon>
      <InputGroupInput
        defaultValue={initial}
        placeholder={placeholder}
        onChange={(event) => {
          clearTimeout(timer.current)
          const value = event.target.value.trim()
          timer.current = setTimeout(() => push(value), SEARCH.debounceMs)
        }}
      />
    </InputGroup>
  )
}
