import { isAuthorized } from "@/server/auth/session"
import { resolveFileById } from "./resolve"
import { streamFile } from "./stream-file"

/** Shared body of the /media and /download Route Handlers: auth, id -> path, Range streaming. */
export async function serveFileRoute(request: Request, id: string, download: boolean): Promise<Response> {
  if (!(await isAuthorized())) return new Response("Unauthorized", { status: 401 })
  const file = resolveFileById(id)
  if (!file) return new Response("Not found", { status: 404 })
  return streamFile(request, file.absPath, { download, fileName: file.name })
}
