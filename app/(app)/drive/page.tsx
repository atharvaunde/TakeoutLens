import { Crumb } from "@/components/layout/crumb"
import { DriveExplorer } from "@/components/drive/drive-explorer"
import { parseTableParams } from "@/lib/helper"
import { listDrive } from "@/server/services/drive"

export default async function DrivePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams
  const listing = await listDrive(typeof query.path === "string" ? query.path : undefined, parseTableParams(query))
  return (
    <>
      <Crumb value={["Drive", ...listing.breadcrumbs.map((b) => b.label)].join(" / ")} />
      <DriveExplorer basePath="/drive" rootLabel="Drive" breadcrumbs={listing.breadcrumbs} rows={listing.rows} total={listing.total} folder={listing.folder} searching={listing.searching} />
    </>
  )
}
