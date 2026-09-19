import fs from "node:fs"
import os from "node:os"
import path from "node:path"

// Synthetic Takeout tree mimicking the shapes seen in a real export. Contains NO real data.
// Grow this generator as modules are built (mail bodies, calendar events, ...).

const NARROW_NBSP = " "

export function write(root: string, rel: string, content: string | Buffer) {
  const file = path.join(root, rel)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, content)
}

export function createFixture(options: { wrap?: boolean } = {}): { base: string; root: string } {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "takeout-fixture-"))
  const root = options.wrap ? path.join(base, "Takeout") : base
  fs.mkdirSync(root, { recursive: true })

  write(
    root,
    "Mail/All mail Including Spam and Trash.mbox",
    [
      "From 1000000000000000001@xxx Mon Oct 16 01:29:30 +0000 2023",
      "X-GM-THRID: 1000000000000000001",
      "X-Gmail-Labels: Inbox,Important",
      "From: Alice Example <alice@example.test>",
      "To: Me <me@example.test>",
      "Subject: Hello fixture",
      "Date: Mon, 16 Oct 2023 01:29:30 +0000",
      "Message-ID: <fixture-1@example.test>",
      "Content-Type: text/plain; charset=UTF-8",
      "",
      "Hello from the fixture.",
      "",
    ].join("\n")
  )
  write(
    root,
    "Google Chat/Groups/DM AAAAAAAAAAE/messages.json",
    JSON.stringify({
      messages: [
        {
          creator: { name: "Me", email: "me@example.test", user_type: "Human" },
          created_date: `Tuesday, October 27, 2020 at 10:02:02${NARROW_NBSP}AM UTC`,
          text: "Hello!",
          topic_id: "T1",
          message_id: "AAAAAAAAAAE/T1/T1",
        },
      ],
    })
  )
  write(
    root,
    "Google Chat/Groups/DM AAAAAAAAAAE/group_info.json",
    JSON.stringify({
      members: [
        { name: "Me", email: "me@example.test", user_type: "Human" },
        { name: "Bob Example", email: "bob@example.test", user_type: "Human" },
      ],
    })
  )
  write(root, "Calendar/me@example.test.ics", "BEGIN:VCALENDAR\nVERSION:2.0\nEND:VCALENDAR\n")
  write(root, "Contacts/All Contacts/All Contacts.vcf", "BEGIN:VCARD\nVERSION:3.0\nFN:Alice Example\nEND:VCARD\n")
  write(root, "Drive/Reports/report.docx", "not a real docx")
  write(root, "Drive/photo.jpg", Buffer.from([0xff, 0xd8, 0xff, 0xd9]))
  write(root, "Keep/Note.json", JSON.stringify({ title: "Note", textContent: "hello", isTrashed: false }))
  write(root, "Tasks/Tasks.json", JSON.stringify({ kind: "tasks#taskLists", items: [] }))
  write(root, "My Activity/Search/MyActivity.html", "<html></html>")
  write(root, "archive_browser.html", "<html></html>")
  return { base, root }
}

export function cleanup(base: string) {
  fs.rmSync(base, { recursive: true, force: true })
}
