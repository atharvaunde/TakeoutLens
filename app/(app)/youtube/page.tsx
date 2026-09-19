import { playlistColumns } from "@/columns/youtube-playlists.column"
import { PageHeader } from "@/components/common/page-header"
import { TabLinks } from "@/components/common/tab-links"
import { DataTable } from "@/components/data-table/data-table"
import { VideosTable } from "@/components/youtube/videos-table"
import { YOUTUBE_TABS } from "@/lib/constant"
import { formatNumber, parseTableParams } from "@/lib/helper"
import { getYoutubeOverview, listPlaylists, listVideos } from "@/server/services/youtube"

export default async function YoutubePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams
  const tab = query.tab === "playlists" ? "playlists" : "videos"
  const params = parseTableParams(query)
  const overview = await getYoutubeOverview()
  const videos = tab === "videos" ? await listVideos(params) : null
  const playlists = tab === "playlists" ? await listPlaylists(params) : null

  return (
    <>
      <PageHeader
        title="YouTube"
        description={`${overview.channelTitle} · ${formatNumber(overview.videoCount)} videos · ${formatNumber(overview.playlistCount)} playlists`}
        actions={<TabLinks param="tab" value={tab} options={YOUTUBE_TABS} />}
      />
      {videos ? <VideosTable rows={videos.rows} total={videos.total} /> : null}
      {playlists ? <DataTable columns={playlistColumns} data={playlists.rows} rowCount={playlists.total} searchable searchPlaceholder="Search playlists…" emptyTitle="No playlists" /> : null}
    </>
  )
}
