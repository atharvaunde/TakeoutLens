"use client"

import { useCallback, useMemo, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { TABLE_PARAMS } from "@/lib/constant"
import { parseTableParams } from "@/lib/helper"

/** Table state lives in the URL so the server (page.tsx) can query only what is shown. */
export function useTableUrlState(filterIds: readonly string[]) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const params = useMemo(
    () => parseTableParams(Object.fromEntries(searchParams.entries()), filterIds),
    [searchParams, filterIds]
  )

  /** Apply several param changes at once (null/"" removes). Resets to page 1 unless `keepPage`. */
  const update = useCallback(
    (changes: Record<string, string | null>, keepPage = false) => {
      const next = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(changes)) {
        if (value === null || value === "") next.delete(key)
        else next.set(key, value)
      }
      if (!keepPage && !(TABLE_PARAMS.page in changes)) next.delete(TABLE_PARAMS.page)
      const query = next.toString()
      startTransition(() => router.push(query ? `${pathname}?${query}` : pathname))
    },
    [pathname, router, searchParams]
  )

  return { params, isPending, update }
}
