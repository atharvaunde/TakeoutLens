"use client"

import { useState } from "react"

import { contactColumns, type ContactRow } from "@/columns/contacts.column"
import { DataTable } from "@/components/data-table/data-table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { CONTACT_FILTERS } from "@/lib/constant"
import { getInitials } from "@/lib/helper"

const Detail = ({ label, value }: { label: string; value: string }) =>
  value ? (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="whitespace-pre-wrap break-words">{value}</span>
    </div>
  ) : null

export function ContactsTable({ rows, total }: { rows: ContactRow[]; total: number }) {
  const [selected, setSelected] = useState<ContactRow | null>(null)
  return (
    <>
      <DataTable
        columns={contactColumns}
        data={rows}
        rowCount={total}
        searchable
        searchPlaceholder="Search contacts…"
        filters={CONTACT_FILTERS}
        rowIdKey="id"
        onRowClick={setSelected}
        emptyTitle="No contacts"
      />
      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-md">
          {selected ? (
            <>
              <div className="flex items-center gap-4">
                <Avatar className="size-14">
                  {selected.photoId ? <AvatarImage src={`/thumb/${selected.photoId}`} alt="" /> : null}
                  <AvatarFallback>{getInitials(selected.name)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <DialogTitle>{selected.name}</DialogTitle>
                  <DialogDescription>{selected.org || "Contact"}</DialogDescription>
                </div>
              </div>
              <div className="flex flex-col gap-3 text-sm">
                <Detail label="Email" value={selected.email.split(", ").join("\n")} />
                <Detail label="Phone" value={selected.phone.split(", ").join("\n")} />
                <Detail label="Address" value={selected.address} />
                <Detail label="Birthday" value={selected.birthday} />
                <Detail label="Notes" value={selected.note} />
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
