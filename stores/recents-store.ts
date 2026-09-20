"use client"

import { create } from "zustand"

import { SHELL, type ModuleKind } from "@/lib/constant"

export interface RecentItem {
  label: string
  href: string
  moduleId: string
  kind: ModuleKind
  at: number
}

interface RecentsState {
  items: RecentItem[]
  loaded: boolean
  load: () => void
  push: (item: Omit<RecentItem, "at">) => void
}

const persist = (items: RecentItem[]) => {
  try {
    localStorage.setItem(SHELL.recentsStorageKey, JSON.stringify(items))
  } catch {
    // not remembered
  }
}

/** "Pick up where you left off": the last places the user opened, kept in this browser only. */
export const useRecentsStore = create<RecentsState>((set, get) => ({
  items: [],
  loaded: false,
  load: () => {
    try {
      const parsed = JSON.parse(localStorage.getItem(SHELL.recentsStorageKey) ?? "[]") as RecentItem[]
      set({ items: Array.isArray(parsed) ? parsed.slice(0, SHELL.maxRecents) : [], loaded: true })
    } catch {
      set({ loaded: true })
    }
  },
  push: (item) => {
    const items = [{ ...item, at: Date.now() }, ...get().items.filter((existing) => existing.href !== item.href)].slice(0, SHELL.maxRecents)
    set({ items })
    persist(items)
  },
}))
