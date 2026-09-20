import { NextResponse, type NextRequest } from "next/server"

import { ALLOWED_LOCAL_HOSTS, AUTH, ENV, SESSION } from "@/lib/constant"

// First layer only: Host/Origin allowlist (blocks DNS rebinding + cross-site requests) and a
// cheap cookie check. Real authorization happens in requireSession() at every data access.

function allowedHosts(): string[] {
  const extra = (process.env[ENV.allowedHosts] ?? "").split(",").map((h) => h.trim().toLowerCase()).filter(Boolean)
  return [...ALLOWED_LOCAL_HOSTS, ...extra]
}

function hostnameOf(hostHeader: string): string {
  // "localhost:3000" -> "localhost"; "[::1]:3000" -> "[::1]"
  return hostHeader.startsWith("[") ? hostHeader.slice(0, hostHeader.indexOf("]") + 1) : hostHeader.split(":")[0]
}

export function isAllowedHost(hostHeader: string | null, allowed = allowedHosts()): boolean {
  return Boolean(hostHeader) && allowed.includes(hostnameOf(hostHeader as string).toLowerCase())
}

export function isAllowedOrigin(origin: string | null, allowed = allowedHosts()): boolean {
  if (!origin) return true // same-origin navigations and non-browser clients send no Origin
  try {
    return allowed.includes(new URL(origin).hostname.replace(/^(::1)$/, "[::1]").toLowerCase())
  } catch {
    return false
  }
}

export function proxy(request: NextRequest) {
  if (!isAllowedHost(request.headers.get("host")) || !isAllowedOrigin(request.headers.get("origin"))) {
    return new NextResponse("Forbidden", { status: 403 })
  }

  const { pathname } = request.nextUrl
  const isPublic = (AUTH.publicPaths as readonly string[]).includes(pathname)
  if (!isPublic && !request.cookies.get(SESSION.cookieName)?.value) {
    // Handlers and pages re-check the session properly; this just avoids rendering for anonymous visitors.
    return NextResponse.redirect(new URL("/login", request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png|brand/).*)"],
}
