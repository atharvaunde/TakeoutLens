import Link from "next/link"

import { groupMemberColumns } from "@/columns/group-members.column"
import { Crumb } from "@/components/layout/crumb"
import { SearchInput } from "@/components/common/search-input"
import { TablePage } from "@/components/common/table-page"
import { UrlOptionGroup } from "@/components/common/url-option-group"
import { DataTable } from "@/components/data-table/data-table"
import { TableControls } from "@/components/data-table/table-controls"
import { UrlPagination } from "@/components/data-table/url-pagination"
import { DiscussionList } from "@/components/groups/discussion-list"
import { MailThread } from "@/components/mail/mail-thread"
import { GROUP_TABS } from "@/lib/constant"
import { parseTableParams, pluralize } from "@/lib/helper"
import { getConfig } from "@/server/config"
import { getGroup, listGroupMembers, listGroups } from "@/server/services/groups"
import { getThread, listMailMessages } from "@/server/services/mail"

type Query = Record<string, string | string[] | undefined>
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

export default async function GroupsPage({ searchParams }: { searchParams: Promise<Query> }) {
  const query = await searchParams
  const email = one(query.g)
  const group = email ? await getGroup(email) : null

  if (!group) {
    const groups = await listGroups()
    return (
      <TablePage title="Groups" sub={`${pluralize(groups.length, "group")} · ${pluralize(groups.reduce((sum, g) => sum + g.discussionCount, 0), "thread")}`}>
        <Crumb value="Groups" />
        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-2">
          {groups.map((g) => (
            <Link key={g.email} href={`/groups?g=${encodeURIComponent(g.email)}`} className="flex flex-col gap-2.5 rounded-xl border border-line bg-surf px-3 py-[11px] text-ink no-underline hover:border-acc hover:no-underline">
              <div>
                <div className="text-[13.5px] font-semibold tracking-[-.01em]">{g.name}</div>
                <div className="mt-0.5 truncate font-mono text-[11px] text-faint">{g.email}</div>
              </div>
              <div className="text-[11.5px] text-faint">
                {pluralize(g.memberCount, "member")} · {pluralize(g.discussionCount, "discussion")}
              </div>
            </Link>
          ))}
        </div>
      </TablePage>
    )
  }

  const tab = one(query.tab) === "members" ? "members" : "discussions"
  const params = parseTableParams(query)
  const sub = `${group.email} · ${pluralize(group.memberCount, "member")} · ${pluralize(group.discussionCount, "discussion")}`
  const tabs = <UrlOptionGroup param="tab" value={tab} defaultValue="discussions" resetParams={["page", "q", "m"]} variant="tab" options={GROUP_TABS} />
  const crumb = <Crumb value={`Groups / ${group.name}`} />

  if (tab === "members") {
    const members = await listGroupMembers(group.email, params)
    return (
      <TablePage
        title={group.name}
        sub={sub}
        controls={
          <>
            <Link href="/groups" className="text-xs text-acc hover:underline">
              ‹ All groups
            </Link>
            {tabs}
            <TableControls searchPlaceholder="Search members…" />
          </>
        }
      >
        {crumb}
        <DataTable columns={groupMemberColumns} data={members.rows} rowCount={members.total} rowIdKey="id" emptyTitle="No members" />
      </TablePage>
    )
  }

  const openId = /^\d{1,9}$/.test(one(query.m) ?? "") ? Number(one(query.m)) : null
  const [list, thread] = await Promise.all([listMailMessages({ ...params, dir: params.sort ? params.dir : "desc" }, null, `group:${group.email}`), openId ? getThread(openId) : []])
  const link = (id: number) => {
    const next = new URLSearchParams()
    for (const [key, value] of Object.entries(query)) if (typeof value === "string") next.set(key, value)
    next.set("m", String(id))
    return `/groups?${next.toString()}`
  }

  return (
    <div className="grid h-full grid-cols-[minmax(300px,1fr)_minmax(340px,1.1fr)]">
      {crumb}
      <div className="flex min-h-0 min-w-0 flex-col border-r border-line">
        <div className="flex-none border-b border-line px-4 pt-3.5 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1 text-[17px] font-semibold tracking-[-.02em]">{group.name}</div>
            <Link href="/groups" className="text-xs text-acc hover:underline">
              ‹ All groups
            </Link>
            {tabs}
          </div>
          <div className="mt-0.5 font-mono text-[11px] text-faint">{sub}</div>
          <SearchInput className="mt-2.5 h-[27px] bg-surf text-xs" placeholder="Search discussions…" resetParams={["page"]} />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <DiscussionList rows={list.rows} activeId={openId} hrefFor={link} />
        </div>
        <div className="flex-none border-t border-line2 px-3 py-2">
          <UrlPagination rowCount={list.total} compact />
        </div>
      </div>
      <div className="min-h-0 bg-background">
        {thread.length ? (
          <MailThread key={openId} messages={thread} autoLoadRemote={getConfig().loadRemoteImages} />
        ) : (
          <div className="flex h-full items-center justify-center px-10 text-center">
            <div>
              <div className="text-base font-semibold tracking-[-.015em]">Select a discussion</div>
              <div className="mt-1.5 text-[13px] text-mute">Pick a topic on the left to read it.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
