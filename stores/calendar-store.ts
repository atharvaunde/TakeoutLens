"use client"

import { create } from "zustand"

interface CalendarState {
  /** Calendars the user switched off. Empty = everything visible (the default overlay). */
  hidden: ReadonlySet<number>
  toggle: (id: number) => void
  showAll: () => void
  hideAll: (ids: readonly number[]) => void
  only: (id: number, all: readonly number[]) => void
}

/** UI-only state: which calendars are overlaid. Events themselves come from the server page. */
export const useCalendarStore = create<CalendarState>((set) => ({
  hidden: new Set(),
  toggle: (id) =>
    set((state) => {
      const next = new Set(state.hidden)
      if (!next.delete(id)) next.add(id)
      return { hidden: next }
    }),
  showAll: () => set({ hidden: new Set() }),
  hideAll: (ids) => set({ hidden: new Set(ids) }),
  only: (id, all) => set({ hidden: new Set(all.filter((other) => other !== id)) }),
}))
