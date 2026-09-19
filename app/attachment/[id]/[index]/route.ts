import { isAuthorized } from "@/server/auth/session"
import { getMailDownload } from "@/server/services/mail"

// Mail attachments and .eml export. Always an attachment + nosniff: message content never executes in our origin.
export async function GET(_request: Request, ctx: RouteContext<"/attachment/[id]/[index]">) {
  if (!(await isAuthorized())) return new Response("Unauthorized", { status: 401 })
  const { id, index } = await ctx.params
  if (!/^\d{1,9}$/.test(id) || !/^(\d{1,4}|eml)$/.test(index)) return new Response("Not found", { status: 404 })
  const file = await getMailDownload(Number(id), index)
  if (!file) return new Response("Not found", { status: 404 })
  return new Response(new Uint8Array(file.body), {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  })
}
