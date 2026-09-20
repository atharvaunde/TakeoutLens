"use client"

import { create } from "zustand"

import { SHELL } from "@/lib/constant"

interface UiState {
  railMini: boolean
  toggleRail: () => void
  /** Load the remembered sidebar state after mount (keeps the first client render equal to the server render). */
  loadRail: () => void
  /** Breadcrumb tail shown in the top bar (pages set it; falls back to the module name). */
  crumb: string | null
  setCrumb: (crumb: string | null) => void
  cmdOpen: boolean
  setCmdOpen: (open: boolean) => void
}

export const useUiStore = create<UiState>((set, get) => ({
  railMini: false,
  toggleRail: () => {
    const next = !get().railMini
    set({ railMini: next })
    try {
      localStorage.setItem(SHELL.railStorageKey, next ? "1" : "0")
    } catch {
      // not remembered
    }
  },
  loadRail: () => {
    try {
      set({ railMini: localStorage.getItem(SHELL.railStorageKey) === "1" })
    } catch {
      // ignore
    }
  },
  crumb: null,
  setCrumb: (crumb) => set({ crumb }),
  cmdOpen: false,
  setCmdOpen: (cmdOpen) => set({ cmdOpen }),
}))
