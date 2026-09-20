"use client"

import { useEffect } from "react"

import { useUiStore } from "@/stores/ui-store"

/** Sets the top-bar breadcrumb tail for the current page (e.g. "Mail / Inbox"). Renders nothing. */
export function Crumb({ value }: { value: string }) {
  const setCrumb = useUiStore((state) => state.setCrumb)
  useEffect(() => {
    setCrumb(value)
    return () => setCrumb(null)
  }, [value, setCrumb])
  return null
}
