import { playlistColumns } from "@/columns/youtube-playlists.column"
import { Crumb } from "@/components/layout/crumb"
import { TablePage } from "@/components/common/table-page"
import { UrlOptionGroup } from "@/components/common/url-option-group"
import { DataTable } from "@/components/data-table/data-table"
import { TableControls } from "@/components/data-table/table-controls"
import { VideosTable } from "@/components/youtube/videos-table"
import { YOUTUBE_TABS } from "@/lib/constant"
import { formatBytes, parseTableParams, pluralize } from "@/lib/helper"
import { getModuleSummary } from "@/server/services/modules"
import { getYoutubeOverview, listPlaylists, listVideos } from "@/server/services/youtube"

export default async function YoutubePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams
  const tab = query.tab === "playlists" ? "playlists" : "videos"
  const params = parseTableParams(query)
  const [overview, summary] = await Promise.all([getYoutubeOverview(), getModuleSummary("youtube")])
  const videos = tab === "videos" ? await listVideos(params) : null
  const playlists = tab === "playlists" ? await listPlaylists(params) : null

  return (
    <TablePage
      title="YouTube"
      sub={`${overview.channelTitle} · ${pluralize(overview.videoCount, "video")} · ${pluralize(overview.playlistCount, "playlist")} · ${formatBytes(summary.totalBytes)}`}
      controls={
        <>
          <UrlOptionGroup param="tab" value={tab} defaultValue="videos" resetParams={["page", "q", "sort", "dir"]} variant="tab" options={YOUTUBE_TABS} />
          <TableControls searchPlaceholder={tab === "videos" ? "Search videos…" : "Search playlists…"} />
        </>
      }
    >
      <Crumb value="YouTube" />
      {videos ? <VideosTable rows={videos.rows} total={videos.total} /> : null}
      {playlists ? <DataTable columns={playlistColumns} data={playlists.rows} rowCount={playlists.total} rowIdKey="id" emptyTitle="No playlists" /> : null}
    </TablePage>
  )
}
