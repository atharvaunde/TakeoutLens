import { Crumb } from "@/components/layout/crumb"
import { SearchInput } from "@/components/common/search-input"
import { SortChips } from "@/components/common/sort-chips"
import { UrlPagination } from "@/components/data-table/url-pagination"
import { MailLabels } from "@/components/mail/mail-labels"
import { MailList } from "@/components/mail/mail-list"
import { MailThread } from "@/components/mail/mail-thread"
import { MAIL_TEXT } from "@/lib/constant"
import { formatNumber, parseTableParams } from "@/lib/helper"
import { getThread, listMailLabels, listMailMessages } from "@/server/services/mail"

type Query = Record<string, string | string[] | undefined>
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

const SORT_OPTIONS = [
  { value: "date", label: "Date", defaultDir: "desc" },
  { value: "from", label: "Sender", defaultDir: "asc" },
] as const

export default async function MailPage({ searchParams }: { searchParams: Promise<Query> }) {
  const query = await searchParams
  const params = parseTableParams(query)
  const label = one(query.label) || null
  const openId = /^\d{1,9}$/.test(one(query.m) ?? "") ? Number(one(query.m)) : null

  const link = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams()
    for (const [key, value] of Object.entries(query)) if (typeof value === "string") next.set(key, value)
    for (const [key, value] of Object.entries(changes)) {
      if (value === null) next.delete(key)
      else next.set(key, value)
    }
    const qs = next.toString()
    return qs ? `/mail?${qs}` : "/mail"
  }

  const [{ total, labels }, list, thread] = await Promise.all([listMailLabels(), listMailMessages(params, label), openId ? getThread(openId) : []])
  const activeName = label ? (labels.find((l) => l.label === label)?.name ?? label) : MAIL_TEXT.allMail

  return (
    <div className="grid h-full grid-cols-[206px_minmax(280px,1fr)_minmax(320px,1.05fr)]">
      <Crumb value={`Mail / ${activeName}`} />
      <MailLabels total={total} labels={labels} active={label} hrefFor={(next) => link({ label: next, page: null, m: null })} />

      <div className="flex min-h-0 min-w-0 flex-col border-r border-line bg-surf">
        <div className="flex flex-none flex-col gap-2 border-b border-line2 px-[11px] py-[9px]">
          <SearchInput placeholder={`Search in ${activeName}…`} resetParams={["page"]} />
          <div className="flex items-center justify-between">
            <div className="text-[11.5px] text-faint">
              <span className="font-semibold text-ink">{formatNumber(list.total)}</span> messages
            </div>
            <SortChips options={SORT_OPTIONS} fallback="date" />
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <MailList rows={list.rows} activeId={openId} hrefFor={(id) => link({ m: String(id) })} />
        </div>
        <div className="flex-none border-t border-line2 px-3 py-2">
          <UrlPagination rowCount={list.total} compact />
        </div>
      </div>

      <div className="min-h-0 bg-background">
        {thread.length ? (
          <MailThread key={openId} messages={thread} />
        ) : (
          <div className="flex h-full items-center justify-center px-10 text-center">
            <div>
              <div className="text-base font-semibold tracking-[-.015em]">{openId ? "Message not found" : "Select a message"}</div>
              <div className="mt-1.5 text-[13px] text-mute">Pick a message from the list to read it.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
