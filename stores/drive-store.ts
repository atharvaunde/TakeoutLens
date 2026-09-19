"use client"

import { create } from "zustand"

import { DRIVE_VIEW_STORAGE_KEY, DRIVE_VIEWS, type DriveView } from "@/lib/constant"

interface DriveState {
  view: DriveView
  setView: (view: DriveView) => void
  /** Load the remembered view after mount (keeps the server render and first client render identical). */
  loadView: () => void
}

const isView = (value: unknown): value is DriveView => DRIVE_VIEWS.includes(value as DriveView)

export const useDriveStore = create<DriveState>((set) => ({
  view: "list",
  setView: (view) => {
    set({ view })
    try {
      localStorage.setItem(DRIVE_VIEW_STORAGE_KEY, view)
    } catch {
      // storage unavailable (private mode): the choice just isn't remembered
    }
  },
  loadView: () => {
    try {
      const stored = localStorage.getItem(DRIVE_VIEW_STORAGE_KEY)
      if (isView(stored)) set({ view: stored })
    } catch {
      // ignore
    }
  },
}))
