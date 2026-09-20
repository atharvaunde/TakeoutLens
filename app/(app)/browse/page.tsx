import { Crumb } from "@/components/layout/crumb"
import { DriveExplorer } from "@/components/drive/drive-explorer"
import { parseTableParams } from "@/lib/helper"
import { listBrowse } from "@/server/services/drive"

export default async function BrowsePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams
  const listing = await listBrowse(typeof query.path === "string" ? query.path : undefined, parseTableParams(query))
  return (
    <>
      <Crumb value={["Other data", ...listing.breadcrumbs.map((b) => b.label)].join(" / ")} />
      <DriveExplorer basePath="/browse" rootLabel="All products" breadcrumbs={listing.breadcrumbs} rows={listing.rows} total={listing.total} folder={listing.folder} searching={listing.searching} />
    </>
  )
}
