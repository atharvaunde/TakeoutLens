"use server"

import type { PhotoInfo } from "@/lib/types"
import { getPhotoInfo } from "@/server/services/photos"

/** Photo details are read on demand when the viewer opens. Auth is enforced inside the service. */
export async function loadPhotoInfoAction(fileId: number): Promise<PhotoInfo | null> {
  return getPhotoInfo(fileId)
}
