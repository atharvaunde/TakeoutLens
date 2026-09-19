import { parse } from "csv-parse/sync"

export interface ParsedCsv {
  headers: string[]
  rows: Record<string, string>[]
}

/** Forgiving CSV reader for Takeout files (quoted newlines, BOM, ragged rows). */
export function parseCsv(text: string, maxRows = Infinity): ParsedCsv {
  const records = parse(text.replace(/^﻿/, ""), { relax_column_count: true, skip_empty_lines: true, relax_quotes: true, to: maxRows === Infinity ? undefined : maxRows + 1 }) as string[][]
  const [headerRow = [], ...body] = records
  const headers = headerRow.map((h, i) => h.trim() || `Column ${i + 1}`)
  return {
    headers,
    rows: body.map((cells) => Object.fromEntries(headers.map((h, i) => [h, cells[i] ?? ""]))),
  }
}
