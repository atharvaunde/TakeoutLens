"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { OptionGroup, type OptionVariant } from "./option-group"

interface UrlOptionGroupProps<T extends string> {
  param: string
  options: readonly { value: T; label: string }[]
  value: T
  /** Value that means "param absent" (kept out of the URL). */
  defaultValue?: T
  /** Params to drop when the selection changes (paging, search, sort...). */
  resetParams?: readonly string[]
  variant?: OptionVariant
  className?: string
}

/** OptionGroup bound to a URL param, so the server page renders the selected option. */
export function UrlOptionGroup<T extends string>({ param, options, value, defaultValue, resetParams = ["page"], variant, className }: UrlOptionGroupProps<T>) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  return (
    <OptionGroup
      options={options}
      value={value}
      variant={variant}
      className={className}
      onChange={(next) => {
        const params = new URLSearchParams(searchParams.toString())
        for (const key of resetParams) params.delete(key)
        if (defaultValue !== undefined && next === defaultValue) params.delete(param)
        else params.set(param, next)
        const query = params.toString()
        router.push(query ? `${pathname}?${query}` : pathname)
      }}
    />
  )
}
