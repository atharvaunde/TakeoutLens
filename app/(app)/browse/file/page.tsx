import Link from "next/link"
import { notFound } from "next/navigation"

import { CsvViewer } from "@/components/browse/csv-viewer"
import { Crumb } from "@/components/layout/crumb"
import { TablePage } from "@/components/common/table-page"
import { TableControls } from "@/components/data-table/table-controls"
import { MailMessageFrame } from "@/components/mail/mail-message-frame"
import { formatBytes, parseTableParams } from "@/lib/helper"
import { getConfig } from "@/server/config"
import { getFileForViewer, getFilePreview } from "@/server/services/viewer"

const BUTTON = "rounded-[7px] border border-line bg-surf px-2.5 py-[5px] text-xs font-medium text-ink no-underline hover:bg-hov hover:no-underline"

export default async function FileViewerPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams
  const id = typeof query.id === "string" && /^\d{1,9}$/.test(query.id) ? Number(query.id) : null
  const file = id ? await getFileForViewer(id) : null
  if (!file) notFound()
  const preview = await getFilePreview(file, parseTableParams(query))
  const folder = file.relPath.split("/").slice(0, -1).join("/")

  return (
    <TablePage
      title={file.name}
      sub={`${file.relPath} · ${formatBytes(file.size)}`}
      controls={
        <>
          <Link href={`/browse?path=${encodeURIComponent(folder)}`} className={BUTTON}>
            ‹ Back
          </Link>
          <a href={`/download/${file.id}`} download className={BUTTON}>
            Download
          </a>
          {preview.kind === "csv" ? <TableControls searchPlaceholder="Search this file…" /> : null}
        </>
      }
    >
      <Crumb value={`Other data / ${file.name}`} />
      {preview.kind === "csv" ? (
        <CsvViewer headers={preview.headers} rows={preview.rows} total={preview.total} secretHeaders={preview.passwordHeaders} />
      ) : preview.kind === "html" ? (
        <MailMessageFrame html={preview.html} text="" autoLoadRemote={getConfig().loadRemoteImages} />
      ) : preview.kind === "text" || preview.kind === "json" ? (
        <div className="flex flex-col gap-2">
          {preview.truncated ? <p className="font-mono text-[10px] text-faint">Showing the beginning of a large file. Download it to see everything.</p> : null}
          <pre className="max-h-[75vh] overflow-auto rounded-xl border border-line bg-panel p-4 font-mono text-[11.5px] leading-relaxed whitespace-pre-wrap break-words">{preview.text}</pre>
        </div>
      ) : (
        <div className="py-16 text-center">
          <div className="text-base font-semibold tracking-[-.015em]">No preview</div>
          <div className="mt-1.5 text-[13px] text-mute">{preview.reason} Use Download to open it on your computer.</div>
        </div>
      )}
    </TablePage>
  )
}
