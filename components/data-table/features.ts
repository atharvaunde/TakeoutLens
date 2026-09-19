import { rowPaginationFeature, rowSortingFeature, tableFeatures } from "@tanstack/react-table"

// Server-driven table: pagination and sorting are performed by the server
// (via URL params), so no client row models are registered.
export const dataTableFeatures = tableFeatures({ rowPaginationFeature, rowSortingFeature })
export type DataTableFeatures = typeof dataTableFeatures
