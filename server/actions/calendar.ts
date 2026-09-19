"use server"

import type { CalendarEventDetail } from "@/lib/types"
import { getEventDetail } from "@/server/services/calendar"

/** Event details are fetched on demand when an event is opened. */
export async function loadEventDetailAction(id: number, occurrenceStartWall?: number): Promise<CalendarEventDetail | null> {
  return getEventDetail(id, occurrenceStartWall)
}
