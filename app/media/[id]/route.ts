import { serveFileRoute } from "@/server/files/serve"

// Inline image/video bytes with Range support. Requested natively by <img>/<video>, not by client code.
export async function GET(request: Request, ctx: RouteContext<"/media/[id]">) {
  return serveFileRoute(request, (await ctx.params).id, false)
}
export const HEAD = GET
