"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { INDEXING_REFRESH_MS } from "@/lib/constant"

/** While `active`, re-renders the current route on the server every couple of seconds (no client API calls). */
export function AutoRefresh({ active }: { active: boolean }) {
  const router = useRouter()
  useEffect(() => {
    if (!active) return
    const timer = setInterval(() => router.refresh(), INDEXING_REFRESH_MS)
    return () => clearInterval(timer)
  }, [active, router])
  return null
}
