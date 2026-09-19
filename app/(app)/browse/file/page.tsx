import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeftIcon, DownloadIcon } from "lucide-react"

import { CsvViewer } from "@/components/browse/csv-viewer"
import { PageHeader } from "@/components/common/page-header"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { MailMessageFrame } from "@/components/mail/mail-message-frame"
import { formatBytes, parseTableParams } from "@/lib/helper"
import { getFileForViewer, getFilePreview } from "@/server/services/viewer"

export default async function FileViewerPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams
  const id = typeof query.id === "string" && /^\d{1,9}$/.test(query.id) ? Number(query.id) : null
  const file = id ? await getFileForViewer(id) : null
  if (!file) notFound()
  const preview = await getFilePreview(file, parseTableParams(query))
  const folder = file.relPath.split("/").slice(0, -1).join("/")

  return (
    <>
      <PageHeader
        title={file.name}
        description={`${file.relPath} · ${formatBytes(file.size)}`}
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href={`/browse?path=${encodeURIComponent(folder)}`}>
                <ArrowLeftIcon data-icon="inline-start" />
                Back
              </Link>
            </Button>
            <Button asChild size="sm">
              <a href={`/download/${file.id}`} download>
                <DownloadIcon data-icon="inline-start" />
                Download
              </a>
            </Button>
          </>
        }
      />
      {preview.kind === "csv" ? (
        <CsvViewer headers={preview.headers} rows={preview.rows} total={preview.total} secretHeaders={preview.passwordHeaders} />
      ) : preview.kind === "html" ? (
        <MailMessageFrame html={preview.html} text="" />
      ) : preview.kind === "text" || preview.kind === "json" ? (
        <div className="flex flex-col gap-2">
          {preview.truncated ? <p className="text-xs text-muted-foreground">Showing the beginning of a large file. Download it to see everything.</p> : null}
          <pre className="max-h-[70vh] overflow-auto rounded-lg border bg-muted/30 p-4 text-xs whitespace-pre-wrap break-words">{preview.text}</pre>
        </div>
      ) : (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No preview</EmptyTitle>
            <EmptyDescription>{preview.reason} Use Download to open it on your computer.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </>
  )
}
