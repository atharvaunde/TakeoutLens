import { PageHeader } from "@/components/common/page-header"
import { PathBreadcrumbs } from "@/components/common/path-breadcrumbs"
import { DriveExplorer } from "@/components/drive/drive-explorer"
import { parseTableParams } from "@/lib/helper"
import { listBrowse } from "@/server/services/drive"

export default async function BrowsePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams
  const listing = await listBrowse(typeof query.path === "string" ? query.path : undefined, parseTableParams(query))
  return (
    <>
      <PageHeader title="Other data" description="Everything else in your export (My Activity, Chrome, Maps, Pay, …). JSON, CSV, text and HTML open in a viewer." />
      <PathBreadcrumbs
        rootLabel="All products"
        rootHref="/browse"
        items={listing.breadcrumbs.map((b) => ({ label: b.label, href: `/browse?path=${encodeURIComponent(b.path)}` }))}
      />
      <DriveExplorer basePath="/browse" rows={listing.rows} total={listing.total} folder={listing.folder} searching={listing.searching} />
    </>
  )
}
