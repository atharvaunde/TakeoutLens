"use client"

import { create } from "zustand"

interface CalendarState {
  /** False until the shell applies the server's default visibility once. */
  initialized: boolean
  initialize: (hidden: readonly number[]) => void
  /** Calendars the user switched off. Empty = everything visible (the default overlay). */
  hidden: ReadonlySet<number>
  toggle: (id: number) => void
  showAll: () => void
  hideAll: (ids: readonly number[]) => void
  only: (id: number, all: readonly number[]) => void
}

/** UI-only state: which calendars are overlaid. Events themselves come from the server page. */
export const useCalendarStore = create<CalendarState>((set) => ({
  initialized: false,
  initialize: (hidden) => set((state) => (state.initialized ? state : { initialized: true, hidden: new Set(hidden) })),
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
