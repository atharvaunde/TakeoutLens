import { isAuthorized } from "@/server/auth/session"
import { resolveFileById } from "@/server/files/resolve"
import { getThumbnail } from "@/server/files/thumbnail"

export async function GET(_request: Request, ctx: RouteContext<"/thumb/[id]">) {
  if (!(await isAuthorized())) return new Response("Unauthorized", { status: 401 })
  const file = resolveFileById((await ctx.params).id)
  if (!file) return new Response("Not found", { status: 404 })
  const thumbnail = await getThumbnail(file)
  if (!thumbnail) return new Response("Unsupported image", { status: 415 })
  return new Response(new Uint8Array(thumbnail), {
    headers: {
      "Content-Type": "image/webp",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, max-age=3600",
    },
  })
}
