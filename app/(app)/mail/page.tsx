import { DataTable } from "@/components/data-table/data-table"
import { MailLabels } from "@/components/mail/mail-labels"
import { MailThread } from "@/components/mail/mail-thread"
import { mailColumns } from "@/columns/mail-messages.column"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { parseTableParams } from "@/lib/helper"
import { getThread, listMailLabels, listMailMessages } from "@/server/services/mail"

type Query = Record<string, string | string[] | undefined>
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

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

  const [labels, list, thread] = await Promise.all([
    listMailLabels(),
    listMailMessages(params, label),
    openId ? getThread(openId) : [],
  ])
  const rows = list.rows.map((row) => ({ ...row, href: link({ m: String(row.messageId) }) }))

  return (
    <div className="grid h-[calc(100svh-9rem)] min-h-0 grid-cols-[13rem_minmax(0,1.1fr)_minmax(0,1fr)] gap-4">
      <div className="flex min-h-0 flex-col gap-2 rounded-lg border p-2">
        <MailLabels labels={labels} active={label} hrefFor={(next) => link({ label: next, page: null, m: null })} />
      </div>
      <div className="min-h-0 overflow-y-auto">
        <DataTable
          columns={mailColumns}
          data={rows}
          rowCount={list.total}
          rowHrefKey="href"
          rowIdKey="messageId"
          selectedRowId={openId ? String(openId) : null}
          searchable
          searchPlaceholder="Search mail…"
          emptyTitle="No messages"
        />
      </div>
      <div className="flex min-h-0 flex-col rounded-lg border p-3">
        {thread.length ? (
          <MailThread key={openId} messages={thread} />
        ) : (
          <Empty className="flex-1">
            <EmptyHeader>
              <EmptyTitle>{openId ? "Message not found" : "Select a message"}</EmptyTitle>
              <EmptyDescription>Pick a message from the list to read it.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>
    </div>
  )
}
