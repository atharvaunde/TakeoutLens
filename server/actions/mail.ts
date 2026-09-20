"use server"

import { getRawMessage } from "@/server/services/mail"

export async function loadRawMessageAction(messageId: number): Promise<string | null> {
  return getRawMessage(messageId)
}
