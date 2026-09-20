import { ContactsTable } from "@/components/contacts/contacts-table"
import { Crumb } from "@/components/layout/crumb"
import { TablePage } from "@/components/common/table-page"
import { TableControls } from "@/components/data-table/table-controls"
import { CONTACT_FILTERS } from "@/lib/constant"
import { formatBytes, formatNumber, parseTableParams } from "@/lib/helper"
import { listContacts } from "@/server/services/contacts"
import { getModuleSummary } from "@/server/services/modules"

export default async function ContactsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [{ rows, total }, summary] = await Promise.all([listContacts(parseTableParams(await searchParams, CONTACT_FILTERS.map((f) => f.id))), getModuleSummary("contacts")])
  return (
    <TablePage
      title="Contacts"
      sub={`${formatNumber(summary.fileCount)} files · ${formatBytes(summary.totalBytes)} · ${formatNumber(total)} people`}
      controls={<TableControls searchPlaceholder="Search contacts…" filters={CONTACT_FILTERS} />}
    >
      <Crumb value="Contacts" />
      <ContactsTable rows={rows} total={total} />
    </TablePage>
  )
}
