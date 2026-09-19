import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { runChecks } from "@/scripts/check-conventions"

function project(files: Record<string, string>) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "conv-"))
  for (const [rel, content] of Object.entries(files)) {
    const full = path.join(root, rel)
    fs.mkdirSync(path.dirname(full), { recursive: true })
    fs.writeFileSync(full, content)
  }
  return root
}

describe("check-conventions", () => {
  it("passes a clean project", () => {
    const root = project({
      "components/a.tsx": `"use client"\nexport const A = () => null\n`,
      "app/(app)/mail/page.tsx": "export default () => null",
      "app/(app)/mail/loading.tsx": "export default () => null",
    })
    expect(runChecks(root)).toEqual([])
  })

  it.each([
    ["E1", "components/a.tsx", `"use client"\nfetch("/x")\n`],
    ["E1", "components/a.tsx", `"use client"\nimport { x } from "@/server/db"\n`],
    ["E5", "components/a.tsx", `import type { ColumnDef } from "@tanstack/react-table"\n`],
    ["E6", "components/a.tsx", `export const f = (d: Date) => d.toLocaleDateString()\n`],
    ["style", "components/a.tsx", `export const A = () => <div className="space-y-4" />\n`],
  ])("flags %s violation", (rule, file, content) => {
    const root = project({ [file]: content })
    expect(runChecks(root).map((v) => v.rule)).toContain(rule)
  })

  it("allows client files to import Server Functions from server/actions", () => {
    const root = project({ "components/a.tsx": `"use client"\nimport { go } from "@/server/actions/chat"\n` })
    expect(runChecks(root)).toEqual([])
  })

  it("flags a route without loading.tsx", () => {
    const root = project({ "app/(app)/chat/page.tsx": "export default () => null" })
    expect(runChecks(root).map((v) => v.rule)).toContain("E8")
  })
})
