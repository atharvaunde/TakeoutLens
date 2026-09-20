import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

// Mechanical enforcement of the owner-mandated rules (rules E1, E5, E6, E8).

export interface Violation {
  rule: string
  file: string
  detail: string
}

const SKIP_DIRS = new Set(["node_modules", ".next", ".git", "out", "build", "coverage", "design"])

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, out)
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full)
  }
  return out
}

const isUnder = (rel: string, ...prefixes: string[]) => prefixes.some((p) => rel.startsWith(p))
const isClientFile = (src: string) => /^\s*["']use client["']/.test(src)

export function runChecks(root: string): Violation[] {
  const violations: Violation[] = []
  const add = (rule: string, file: string, detail: string) => violations.push({ rule, file, detail })

  for (const abs of walk(root)) {
    const rel = path.relative(root, abs).split(path.sep).join("/")
    if (isUnder(rel, "scripts/", "tests/")) continue
    if (rel.endsWith(".test.ts") || rel.endsWith(".test.tsx")) continue
    const src = fs.readFileSync(abs, "utf8")

    // E1: no client-side API calls, no client imports of server code.
    if (isClientFile(src)) {
      if (/\b(fetch|axios)\s*\(|XMLHttpRequest|\baxios\b/.test(src)) {
        add("E1", rel, "client file performs a network call (fetch/axios/XMLHttpRequest)")
      }
      if (/from\s+["'](@\/)?server\/(?!actions\/)/.test(src)) {
        add("E1", rel, "client file imports from server/ (only server/actions is allowed)")
      }
    }

    // E5: TanStack Table is only used in the shared DataTable; columns only in columns/.
    if (!isUnder(rel, "components/data-table/", "columns/")) {
      if (/\buseReactTable\b/.test(src)) add("E5", rel, "useReactTable outside components/data-table/")
      if (/\bColumnDef\b/.test(src)) add("E5", rel, "ColumnDef outside components/data-table/ or columns/")
    }

    // E6: formatting only in lib/helper.ts (generated shadcn primitives in components/ui/ are exempt).
    if (rel !== "lib/helper.ts" && !isUnder(rel, "components/ui/") && /\.toLocale\w*\(|\bIntl\./.test(src)) {
      add("E6", rel, "toLocale*/Intl.* outside lib/helper.ts")
    }

    // E9: design tokens live in app/globals.css. No colour literals in code (generated shadcn primitives and the
    // isolated email iframe document, which cannot inherit CSS variables, are exempt).
    if (!isUnder(rel, "components/ui/") && rel !== "components/mail/mail-message-frame.tsx" && /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab)\(/.test(src)) {
      add("E9", rel, "colour literal in code; define a token in app/globals.css and use var(--token) or a Tailwind colour")
    }

    // shadcn styling rule: no space-x/space-y.
    if (rel.endsWith(".tsx") && !isUnder(rel, "components/ui/") && /\bspace-[xy]-/.test(src)) {
      add("style", rel, "space-x-*/space-y-* used; use flex + gap-*")
    }
  }

  // E8: every route folder with a page under app/(app) needs loading.tsx.
  const appDir = path.join(root, "app", "(app)")
  if (fs.existsSync(appDir)) {
    const visit = (dir: string) => {
      const names = fs.readdirSync(dir)
      if (names.includes("page.tsx") && !names.includes("loading.tsx")) {
        add("E8", path.relative(root, dir).split(path.sep).join("/"), "route has page.tsx but no loading.tsx")
      }
      for (const name of names) {
        const full = path.join(dir, name)
        if (fs.statSync(full).isDirectory()) visit(full)
      }
    }
    visit(appDir)
  }

  return violations
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const violations = runChecks(process.cwd())
  if (violations.length === 0) {
    console.log("conventions: ok")
  } else {
    for (const v of violations) console.error(`[${v.rule}] ${v.file}: ${v.detail}`)
    process.exit(1)
  }
}
