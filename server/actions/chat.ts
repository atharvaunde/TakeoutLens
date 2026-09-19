"use server"

import type { ChatMessagePage } from "@/lib/types"
import { getMessages } from "@/server/services/chat"

/** Interactive reads for the timeline (load older/newer pages). Auth is enforced inside the service. */
export async function loadOlderMessagesAction(convId: number, beforeSeq: number): Promise<ChatMessagePage> {
  return getMessages(convId, { beforeSeq })
}

export async function loadNewerMessagesAction(convId: number, afterSeq: number): Promise<ChatMessagePage> {
  return getMessages(convId, { afterSeq })
}
