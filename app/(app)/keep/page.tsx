import { SearchInput } from "@/components/common/search-input"
import { PageHeader } from "@/components/common/page-header"
import { KeepCard } from "@/components/keep/keep-card"
import { KeepViewTabs } from "@/components/keep/keep-view-tabs"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { KEEP, type KeepView } from "@/lib/constant"
import { listKeepNotes } from "@/server/services/keep"

export default async function KeepPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams
  const viewParam = typeof query.view === "string" ? query.view : "notes"
  const view: KeepView = (KEEP.views as readonly string[]).includes(viewParam) ? (viewParam as KeepView) : "notes"
  const search = typeof query.q === "string" ? query.q : ""
  const notes = await listKeepNotes(view, search)

  return (
    <>
      <PageHeader title="Keep" description="Your Google Keep notes and lists." />
      <div className="flex flex-wrap items-center gap-3">
        <KeepViewTabs value={view} />
        <SearchInput className="w-72" placeholder="Search notes…" />
      </div>
      {notes.length ? (
        <div className="columns-[18rem] gap-4 [&>*]:mb-4">
          {notes.map((note) => (
            <KeepCard key={note.id} note={note} />
          ))}
        </div>
      ) : (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No notes</EmptyTitle>
            <EmptyDescription>Nothing here for this view or search.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </>
  )
}
