import fs from "node:fs"
import os from "node:os"
import path from "node:path"

// Synthetic Takeout tree mimicking the shapes seen in a real export. Contains NO real data.
// Grow this generator as modules are built (mail bodies, calendar events, ...).

export const FIXTURE_MBOX = [
  "From 1000000000000000001@xxx Mon Oct 16 01:29:30 +0000 2023",
  "X-GM-THRID: 1000000000000000001",
  "X-Gmail-Labels: Inbox,Important,Opened",
  "From: Alice Example <alice@example.test>",
  "To: Me <me@example.test>",
  "Subject: Quarterly plan",
  "Date: Mon, 16 Oct 2023 01:29:30 +0000",
  "Message-ID: <fixture-1@example.test>",
  "Content-Type: text/plain; charset=UTF-8",
  "",
  "Hello from the fixture. Let us plan the roadmap.",
  ">From the old days we said hello",
  "",
  "From 1000000000000000002@xxx Tue Oct 17 09:00:00 +0000 2023",
  "X-GM-THRID: 1000000000000000001",
  "X-Gmail-Labels: Sent",
  "From: Me <me@example.test>",
  "To: Alice Example <alice@example.test>",
  "Subject: Re: Quarterly plan",
  "Date: Tue, 17 Oct 2023 09:00:00 +0000",
  "Message-ID: <fixture-2@example.test>",
  "MIME-Version: 1.0",
  'Content-Type: multipart/mixed; boundary="B1"',
  "",
  "--B1",
  'Content-Type: multipart/alternative; boundary="B2"',
  "",
  "--B2",
  "Content-Type: text/plain; charset=UTF-8",
  "",
  "Sounds good, see attached.",
  "--B2",
  "Content-Type: text/html; charset=UTF-8",
  "",
  '<html><body><p>Sounds <b>good</b>, see attached.</p><img src="https://tracker.example.test/p.gif"><script>alert(1)</script></body></html>',
  "--B2--",
  "--B1",
  'Content-Type: application/pdf; name="plan.pdf"',
  'Content-Disposition: attachment; filename="plan.pdf"',
  "Content-Transfer-Encoding: base64",
  "",
  "JVBERi0xLjQK",
  "--B1--",
  "",
  "From 1000000000000000003@xxx Wed Oct 18 12:00:00 +0000 2023",
  "X-GM-THRID: 1000000000000000003",
  "X-Gmail-Labels: Inbox,Unread,Category Updates",
  "From: Newsletter <news@example.test>",
  "Subject: =?UTF-8?B?w4l0w6kgbmV3cw==?=",
  "Date: Wed, 18 Oct 2023 12:00:00 +0000",
  "Content-Type: text/plain; charset=UTF-8",
  "",
  "Weekly digest",
  "",
].join("\n")

export const FIXTURE_ICS = [
  "BEGIN:VCALENDAR",
  "VERSION:2.0",
  "X-WR-CALNAME:Fixture Calendar",
  "X-WR-TIMEZONE:Asia/Kolkata",
  "BEGIN:VEVENT",
  "DTSTART:20230102T090000Z",
  "DTEND:20230102T100000Z",
  "UID:utc-event@fixture",
  "SUMMARY:Planning\\, part one",
  "DESCRIPTION:Line one\\nLine two with a very long text that gets folded by the",
  "  exporter across lines",
  "LOCATION:Room 1",
  "ORGANIZER;CN=Alice Example:mailto:alice@example.test",
  "ATTENDEE;CN=Bob;PARTSTAT=ACCEPTED:mailto:bob@example.test",
  "X-GOOGLE-CONFERENCE:https://meet.google.com/abc-defg-hij",
  "STATUS:CONFIRMED",
  "END:VEVENT",
  "BEGIN:VEVENT",
  "DTSTART;TZID=Asia/Kolkata:20230103T103000",
  "DTEND;TZID=Asia/Kolkata:20230103T113000",
  "UID:ist-event@fixture",
  "SUMMARY:Local time event",
  "END:VEVENT",
  "BEGIN:VEVENT",
  "DTSTART;VALUE=DATE:20230105",
  "DTEND;VALUE=DATE:20230106",
  "UID:allday@fixture",
  "SUMMARY:Holiday",
  "END:VEVENT",
  "BEGIN:VEVENT",
  "DTSTART:20230109T040000Z",
  "DTEND:20230109T043000Z",
  "RRULE:FREQ=WEEKLY;COUNT=4",
  "EXDATE:20230116T040000Z",
  "UID:weekly@fixture",
  "SUMMARY:Weekly sync",
  "END:VEVENT",
  "BEGIN:VEVENT",
  "DTSTART:20230123T050000Z",
  "DTEND:20230123T053000Z",
  "RECURRENCE-ID:20230123T040000Z",
  "UID:weekly@fixture",
  "SUMMARY:Weekly sync (moved)",
  "END:VEVENT",
  "END:VCALENDAR",
  "",
].join("\r\n")

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

  write(root, "Mail/All mail Including Spam and Trash.mbox", FIXTURE_MBOX)
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
  write(root, "Calendar/me@example.test.ics", FIXTURE_ICS)
  write(root, "Contacts/All Contacts/All Contacts.vcf", "BEGIN:VCARD\nVERSION:3.0\nFN:Alice Example\nEMAIL:alice@example.test\nEND:VCARD\nBEGIN:VCARD\nVERSION:3.0\nFN:Bob Example\nTEL:123\nEND:VCARD\n")
  write(root, "Contacts/My Contacts/My Contacts.vcf", "BEGIN:VCARD\nVERSION:3.0\nFN:Alice Example\nEMAIL:alice@example.test\nEND:VCARD\n")
  write(root, "Drive/Reports/report.docx", "not a real docx")
  write(root, "Drive/photo.jpg", Buffer.from([0xff, 0xd8, 0xff, 0xd9]))
  write(root, "Google Photos/Photos from 2021/IMG_1.jpg", Buffer.from([0xff, 0xd8, 0xff, 0xd9]))
  write(root, "Google Photos/Photos from 2021/IMG_1.jpg.json", JSON.stringify({ title: "IMG_1.jpg", description: "beach", photoTakenTime: { timestamp: "1622437268" }, geoData: { latitude: 12.5, longitude: 77.1 } }))
  write(root, "Google Photos/Photos from 2021/IMG_2.jpg", Buffer.from([0xff, 0xd8, 0xff, 0xd9]))
  write(root, "Google Photos/Photos from 2021/IMG_3.jpg", Buffer.from([0xff, 0xd8, 0xff, 0xd9]))
  write(root, "Google Photos/Photos from 2021/IMG_3.jpg.supplemental-metadata.json", JSON.stringify({ photoTakenTime: { timestamp: "1500000000" }, geoData: { latitude: 0, longitude: 0 } }))
  write(root, "YouTube and YouTube Music/video metadata/videos.csv", "Video ID,Approx Duration (ms),Video Category,Channel ID,Video Title (Original),Privacy,Video State,Video Create Timestamp\nabc,90000,People,UC1,Demo: part 1,Unlisted,Processed,2021-01-30T05:26:03+00:00\ndef,1000,People,UC1,Missing clip,Private,Processed,2021-02-01T00:00:00+00:00\n")
  write(root, "YouTube and YouTube Music/videos/Demo_ part 1.mp4", "x")
  write(root, "YouTube and YouTube Music/videos/Live Stream.webm", "x")
  write(root, "YouTube and YouTube Music/channels/channel.csv", "Channel ID,Channel Title (Original),Channel Visibility\nUC1,Fixture Channel,Public\n")
  write(root, "YouTube and YouTube Music/playlists/playlists.csv", "Playlist ID,Add new videos to top,Playlist Title (Original),Playlist Create Timestamp,Playlist Update Timestamp,Playlist Video Order,Playlist Visibility\nPL1,False,Fixture list,2020-11-20T07:32:24+00:00,2020-12-20T04:08:54+00:00,Manual,Private\n")
  const GROUP = "Groups/example.test/owned groups/dev@example.test"
  write(root, `${GROUP}/info.csv`, "autoReplyForMembersInOrg,description,groupEmailAddress,name\n,Dev discussions,dev@example.test,Dev Team\n")
  write(root, `${GROUP}/members.csv`, "displayName,email,emailDeliverySetting,role,updatedTimestamp\nAlice Example,alice@example.test,All email,Owner,2022-12-03T20:08:22.000+05:30\n,bob@example.test,Digest,Member,2022-12-04T00:00:00.000+05:30\n")
  write(root, `${GROUP}/topics.mbox`, ["From 2000000000000000001@xxx Mon Jan 02 10:00:00 +0000 2023", "From: Alice Example <alice@example.test>", "To: dev@example.test", "Subject: [dev] Release plan", "Date: Mon, 02 Jan 2023 10:00:00 +0000", "Message-ID: <g1@example.test>", "Content-Type: text/plain; charset=UTF-8", "", "Let us ship on Friday.", ""].join("\n"))
  write(root, "Keep/Note.json", JSON.stringify({ title: "Note", textContent: "hello", isTrashed: false }))
  write(
    root,
    "Tasks/Tasks.json",
    JSON.stringify({
      kind: "tasks#taskLists",
      items: [
        {
          id: "L1",
          title: "My Tasks",
          items: [
            { id: "t1", title: "Write report", status: "needsAction", due: "2023-02-01T00:00:00Z", updated: "2023-01-10T00:00:00Z", notes: "quarterly" },
            { id: "t2", title: "Send invoice", status: "completed", completed: "2023-01-05T00:00:00Z", updated: "2023-01-05T00:00:00Z" },
          ],
        },
      ],
    })
  )
  write(root, "Keep/Archived.json", JSON.stringify({ title: "Old list", color: "YELLOW", isArchived: true, isPinned: false, isTrashed: false, listContent: [{ text: "milk", isChecked: true }], userEditedTimestampUsec: 1_600_000_000_000_000 }))
  write(root, "Chrome/Passwords.csv", "name,url,username,password,note\nexample.test,https://example.test,alice,s3cret!,\nother.test,https://other.test,bob,hunter2,\"multi\nline\"\n")
  write(root, "Chrome/Settings.json", '{"a":1,"b":[1,2]}')
  write(root, "Google Shopping/Orders/Orders.txt", "Order 1\nOrder 2")
  write(root, "My Activity/Search/MyActivity.html", "<html></html>")
  write(root, "archive_browser.html", "<html></html>")
  return { base, root }
}

export function cleanup(base: string) {
  fs.rmSync(base, { recursive: true, force: true })
}
