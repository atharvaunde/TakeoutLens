import { describe, expect, it } from "vitest"

import { parseCsv } from "@/server/csv"

describe("parseCsv", () => {
  it("handles BOM, quoted commas/newlines, ragged rows and blank header cells", () => {
    const { headers, rows } = parseCsv('﻿Name,Note,\r\n"Smith, J","line1\nline2",x\r\nShort\r\n\r\n')
    expect(headers).toEqual(["Name", "Note", "Column 3"])
    expect(rows).toEqual([
      { Name: "Smith, J", Note: "line1\nline2", "Column 3": "x" },
      { Name: "Short", Note: "", "Column 3": "" },
    ])
  })
  it("caps rows", () => {
    expect(parseCsv("a\n1\n2\n3\n", 2).rows).toHaveLength(2)
  })
})
