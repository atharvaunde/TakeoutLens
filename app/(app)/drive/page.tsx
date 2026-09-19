import { PageHeader } from "@/components/common/page-header"
import { PathBreadcrumbs } from "@/components/common/path-breadcrumbs"
import { DriveExplorer } from "@/components/drive/drive-explorer"
import { parseTableParams } from "@/lib/helper"
import { listDrive } from "@/server/services/drive"

export default async function DrivePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams
  const params = parseTableParams(query)
  const listing = await listDrive(typeof query.path === "string" ? query.path : undefined, params)

  return (
    <>
      <PageHeader title="Drive" description="Search and browse your files. Images and videos preview here; other files download." />
      <PathBreadcrumbs
        rootLabel="Drive"
        rootHref="/drive"
        items={listing.breadcrumbs.map((b) => ({ label: b.label, href: `/drive?path=${encodeURIComponent(b.path)}` }))}
      />
      <DriveExplorer basePath="/drive" rows={listing.rows} total={listing.total} folder={listing.folder} searching={listing.searching} />
    </>
  )
}
