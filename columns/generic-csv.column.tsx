"use client"

import { createColumnHelper } from "@tanstack/react-table"

import type { DataTableFeatures } from "@/components/data-table/features"
import { SecretCell } from "@/components/browse/secret-cell"
import type { CsvRowData } from "@/lib/types"

const helper = createColumnHelper<DataTableFeatures, CsvRowData>()

/** One column per CSV header. Sorting ids are `c<index>` so odd header text never breaks accessors. */
export function buildCsvColumns(headers: string[], secretHeaders: readonly string[] = []) {
  return helper.columns(
    headers.map((header, index) =>
      helper.accessor((row) => row[header] ?? "", {
        id: `c${index}`,
        header,
        enableSorting: !secretHeaders.includes(header),
        cell: (info) =>
          secretHeaders.includes(header) ? (
            <SecretCell value={info.getValue()} label={header} />
          ) : (
            <span className="block max-w-96 truncate" title={info.getValue()}>
              {info.getValue()}
            </span>
          ),
      })
    )
  )
}
