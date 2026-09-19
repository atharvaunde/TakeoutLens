import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"

import { groupMemberColumns } from "@/columns/group-members.column"
import { mailColumns } from "@/columns/mail-messages.column"
import { PageHeader } from "@/components/common/page-header"
import { TabLinks } from "@/components/common/tab-links"
import { DataTable } from "@/components/data-table/data-table"
import { MailThread } from "@/components/mail/mail-thread"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { GROUP_TABS } from "@/lib/constant"
import { parseTableParams, pluralize } from "@/lib/helper"
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
      <>
        <PageHeader title="Groups" description="Google Groups you own, with their members and discussions." />
        <div className="grid grid-cols-[repeat(auto-fill,minmax(18rem,1fr))] gap-4">
          {groups.map((g) => (
            <Link key={g.email} href={`/groups?g=${encodeURIComponent(g.email)}`}>
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardHeader>
                  <CardTitle>{g.name}</CardTitle>
                  <CardDescription>{g.email}</CardDescription>
                  <div className="flex gap-2 pt-1">
                    <Badge variant="secondary">{pluralize(g.memberCount, "member")}</Badge>
                    <Badge variant="outline">{pluralize(g.discussionCount, "discussion")}</Badge>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </>
    )
  }

  const tab = one(query.tab) === "members" ? "members" : "discussions"
  const params = parseTableParams(query)
  const openId = /^\d{1,9}$/.test(one(query.m) ?? "") ? Number(one(query.m)) : null
  const header = (
    <PageHeader
      title={group.name}
      description={`${group.email} · ${pluralize(group.memberCount, "member")} · ${pluralize(group.discussionCount, "discussion")}`}
      actions={
        <>
          <Button asChild variant="outline" size="sm">
            <Link href="/groups">
              <ArrowLeftIcon data-icon="inline-start" />
              All groups
            </Link>
          </Button>
          <TabLinks param="tab" value={tab} options={GROUP_TABS} />
        </>
      }
    />
  )

  if (tab === "members") {
    const members = await listGroupMembers(group.email, params)
    return (
      <>
        {header}
        <DataTable columns={groupMemberColumns} data={members.rows} rowCount={members.total} searchable searchPlaceholder="Search members…" emptyTitle="No members" />
      </>
    )
  }

  const [list, thread] = await Promise.all([listMailMessages(params, null, `group:${group.email}`), openId ? getThread(openId) : []])
  const link = (id: number) => {
    const next = new URLSearchParams()
    for (const [key, value] of Object.entries(query)) if (typeof value === "string") next.set(key, value)
    next.set("m", String(id))
    return `/groups?${next.toString()}`
  }
  const rows = list.rows.map((row) => ({ ...row, href: link(row.messageId) }))

  return (
    <>
      {header}
      <div className="grid min-h-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4">
        <div className="min-h-0 overflow-y-auto">
          <DataTable
            columns={mailColumns}
            data={rows}
            rowCount={list.total}
            rowHrefKey="href"
            rowIdKey="messageId"
            selectedRowId={openId ? String(openId) : null}
            searchable
            searchPlaceholder="Search discussions…"
            emptyTitle="No discussions"
          />
        </div>
        <div className="flex min-h-[24rem] flex-col rounded-lg border p-3">
          {thread.length ? (
            <MailThread key={openId} messages={thread} />
          ) : (
            <Empty className="flex-1">
              <EmptyHeader>
                <EmptyTitle>Select a discussion</EmptyTitle>
                <EmptyDescription>Pick a topic on the left to read it.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </div>
      </div>
    </>
  )
}
