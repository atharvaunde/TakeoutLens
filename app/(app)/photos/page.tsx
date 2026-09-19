import { PageHeader } from "@/components/common/page-header"
import { AlbumSelect } from "@/components/photos/album-select"
import { PhotoGallery } from "@/components/photos/photo-gallery"
import { parseTableParams } from "@/lib/helper"
import { listAlbums, listPhotos } from "@/server/services/photos"

export default async function PhotosPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams
  const album = typeof query.album === "string" ? query.album : null
  const { page } = parseTableParams(query)
  const [albums, { photos, total }] = await Promise.all([listAlbums(), listPhotos(page, album)])
  return (
    <>
      <PageHeader title="Photos" description="Your Google Photos, newest first." actions={<AlbumSelect albums={albums} value={album} />} />
      <PhotoGallery photos={photos} total={total} />
    </>
  )
}
