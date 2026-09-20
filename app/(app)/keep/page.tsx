import { Crumb } from "@/components/layout/crumb"
import { SearchInput } from "@/components/common/search-input"
import { UrlOptionGroup } from "@/components/common/url-option-group"
import { KeepBoard } from "@/components/keep/keep-board"
import { ModuleHeader } from "@/components/common/module-header"
import { KEEP, type KeepView } from "@/lib/constant"
import { formatBytes, pluralize } from "@/lib/helper"
import { getModuleSummary } from "@/server/services/modules"
import { listKeepNotes } from "@/server/services/keep"

const VIEW_OPTIONS = [
  { value: "notes", label: "Notes" },
  { value: "archived", label: "Archive" },
  { value: "trash", label: "Trash" },
] as const

export default async function KeepPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams
  const viewParam = typeof query.view === "string" ? query.view : "notes"
  const view: KeepView = (KEEP.views as readonly string[]).includes(viewParam) ? (viewParam as KeepView) : "notes"
  const search = typeof query.q === "string" ? query.q : ""
  const [notes, summary] = await Promise.all([listKeepNotes(view, search), getModuleSummary("keep")])

  return (
    <div className="relative flex h-full flex-col">
      <Crumb value="Keep" />
      <ModuleHeader title="Keep" sub={`${pluralize(notes.length, "note")} · ${formatBytes(summary.totalBytes)}`}>
        <UrlOptionGroup param="view" value={view} defaultValue="notes" variant="tab" options={VIEW_OPTIONS} />
        <SearchInput className="h-[27px] w-[200px] bg-surf text-xs" placeholder="Search notes…" />
      </ModuleHeader>
      <div className="min-h-0 flex-1 overflow-y-auto px-[18px] pt-3.5 pb-8">
        <KeepBoard notes={notes} />
      </div>
    </div>
  )
}
