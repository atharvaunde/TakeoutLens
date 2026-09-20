import { Crumb } from "@/components/layout/crumb"
import { TablePage } from "@/components/common/table-page"
import { UrlOptionGroup } from "@/components/common/url-option-group"
import { PhotoGallery } from "@/components/photos/photo-gallery"
import { formatBytes, formatNumber, parseTableParams } from "@/lib/helper"
import { getModuleSummary } from "@/server/services/modules"
import { listAlbums, listPhotos } from "@/server/services/photos"

const ALL = "all"
const MAX_TABS = 5

export default async function PhotosPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams
  const album = typeof query.album === "string" ? query.album : null
  const { page } = parseTableParams(query)
  const [albums, { photos, total }, summary] = await Promise.all([listAlbums(), listPhotos(page, album), getModuleSummary("photos")])
  const options = [{ value: ALL, label: "All photos" }, ...albums.slice(0, MAX_TABS).map((a) => ({ value: a.album, label: a.album }))]

  return (
    <TablePage
      title="Photos"
      sub={`${formatNumber(total)} items · ${formatBytes(summary.totalBytes)} · newest first`}
      controls={<UrlOptionGroup param="album" value={album ?? ALL} defaultValue={ALL} variant="tab" options={options} />}
    >
      <Crumb value="Photos" />
      <PhotoGallery photos={photos} total={total} />
    </TablePage>
  )
}
