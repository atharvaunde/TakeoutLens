import { serveFileRoute } from "@/server/files/serve"

// Always an attachment (+ nosniff) so a hostile file can never execute in the app's origin.
export async function GET(request: Request, ctx: RouteContext<"/download/[id]">) {
  return serveFileRoute(request, (await ctx.params).id, true)
}
export const HEAD = GET
