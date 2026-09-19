import { PageHeader } from "@/components/common/page-header"
import { ContactsTable } from "@/components/contacts/contacts-table"
import { CONTACT_FILTERS } from "@/lib/constant"
import { parseTableParams } from "@/lib/helper"
import { listContacts } from "@/server/services/contacts"

export default async function ContactsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { rows, total } = await listContacts(parseTableParams(await searchParams, CONTACT_FILTERS.map((f) => f.id)))
  return (
    <>
      <PageHeader title="Contacts" description="Everyone in your Google Contacts export." />
      <ContactsTable rows={rows} total={total} />
    </>
  )
}
