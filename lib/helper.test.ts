import { describe, expect, it } from "vitest"
import { formatBytes, formatDuration, getInitials, formatDate, parseTableParams, getFileKind, toFtsQuery, splitHighlight, getDayKey, zonedTimeToUtc, utcToWall, htmlToText, decodeMimeWords, stripMeetBoilerplate, getMimeType, formatExposure, formatAperture, formatCoordinates } from "@/lib/helper"

describe("helper", () => {
  it("formats bytes", () => {
    expect(formatBytes(0)).toBe("0 B")
    expect(formatBytes(1536)).toBe("1.5 KB")
    expect(formatBytes(4.7 * 1024 ** 3)).toBe("4.7 GB")
  })
  it("formats durations", () => {
    expect(formatDuration(65)).toBe("1:05")
    expect(formatDuration(3725)).toBe("1:02:05")
  })
  it("builds initials", () => {
    expect(getInitials("Atharva Unde")).toBe("AU")
    expect(getInitials("")).toBe("?")
  })
  it("handles invalid dates", () => {
    expect(formatDate("nope")).toBe("—")
  })
  it("parses table params with defaults and bounds", () => {
    expect(parseTableParams({})).toMatchObject({ page: 1, pageSize: 50, sort: null, dir: "asc", search: "" })
    expect(parseTableParams({ page: "3", pageSize: "100", sort: "date", dir: "desc", q: "hi", label: "Inbox" }, ["label"])).toMatchObject({
      page: 3, pageSize: 100, sort: "date", dir: "desc", search: "hi", filters: { label: "Inbox" },
    })
    expect(parseTableParams({ page: "-4", pageSize: "7" })).toMatchObject({ page: 1, pageSize: 50 })
  })
  it("classifies files for preview", () => {
    expect(getFileKind("a.JPG")).toBe("image")
    expect(getFileKind("clip.mp4")).toBe("video")
    expect(getFileKind("report.docx")).toBe("other")
    expect(getFileKind("noext")).toBe("other")
  })
  it("builds safe FTS queries", () => {
    expect(toFtsQuery("Quarterly report!")).toBe('"Quarterly"* "report"*')
    expect(toFtsQuery('" OR 1=1 --')).toBe('"OR"* "1"* "1"*')
    expect(toFtsQuery("   ")).toBeNull()
  })
  it("splits FTS snippets into highlighted parts", () => {
    expect(splitHighlight("a \u0001b\u0002 c", "\u0001", "\u0002")).toEqual([
      { text: "a ", match: false }, { text: "b", match: true }, { text: " c", match: false },
    ])
    expect(splitHighlight("plain", "\u0001", "\u0002")).toEqual([{ text: "plain", match: false }])
  })
  it("derives a UTC day key", () => {
    expect(getDayKey(Date.UTC(2021, 0, 11, 23, 59))).toBe("2021-01-11")
  })
  it("converts between wall-clock time and UTC for a zone", () => {
    const wall = Date.UTC(2021, 0, 15, 10, 30) // 10:30 wall time
    expect(zonedTimeToUtc(wall, "Asia/Kolkata")).toBe(Date.UTC(2021, 0, 15, 5, 0)) // IST is UTC+5:30
    expect(utcToWall(Date.UTC(2021, 0, 15, 5, 0), "Asia/Kolkata")).toBe(wall)
    expect(zonedTimeToUtc(Date.UTC(2021, 6, 1, 12, 0), "Europe/Paris")).toBe(Date.UTC(2021, 6, 1, 10, 0)) // CEST +2
    expect(zonedTimeToUtc(wall, "Not/AZone")).toBe(wall)
  })
  it("converts HTML descriptions to plain text", () => {
    expect(htmlToText("<b>Agenda</b><ul><li>One&nbsp;</li><li>Two &amp; three</li></ul><br>Join: <a href=\"https://x.test/a\">here</a>")).toBe(
      "Agenda\n• One\n• Two & three\n\nJoin: here (https://x.test/a)"
    )
    expect(htmlToText("plain text stays")).toBe("plain text stays")
    expect(htmlToText("a&nbsp\\;b")).toBe("a b")
  })
  it("decodes RFC 2047 words, including ones that span several comma-separated labels", () => {
    expect(decodeMimeWords("=?UTF-8?Q?Inbox,Sent,=E2=9C=94?=")).toBe("Inbox,Sent,✔")
    expect(decodeMimeWords("=?UTF-8?B?w4l0w6k=?= news")).toBe("Été news")
    expect(decodeMimeWords("Plain,Labels")).toBe("Plain,Labels")
    expect(decodeMimeWords("=?bogus-charset?Q?caf=E9?=")).toBe("café")
  })
  it("strips Google Meet boilerplate fenced by dashed rules", () => {
    const rule = "-::~:~::~:~:~:~:~:~:~:~:~:~::~:~::-"
    const text = `Agenda: standup\n\n${rule}\nJoin with Google Meet: https://meet.google.com/abc\nPlease do not edit this section.\n${rule}\n\nNotes below`
    expect(stripMeetBoilerplate(text)).toBe("Agenda: standup\n\nNotes below")
    expect(stripMeetBoilerplate(`Keep me\n${rule}\nno closing rule`)).toBe("Keep me\nno closing rule")
    expect(stripMeetBoilerplate("plain description")).toBe("plain description")
  })
  it("resolves MIME types from extensions", () => {
    expect(getMimeType("Report.PDF")).toBe("application/pdf")
    expect(getMimeType("a.docx")).toBe("application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    expect(getMimeType("noext")).toBe("application/octet-stream")
    expect(getMimeType("Meet Recordings", true)).toBe("inode/directory")
  })
  it("formats photo exposure details", () => {
    expect(formatExposure(0.03)).toBe("1/33 s")
    expect(formatExposure(2)).toBe("2 s")
    expect(formatExposure(null)).toBe("—")
    expect(formatAperture(1.75)).toBe("f/1.8")
    expect(formatCoordinates(12.5, -77.1)).toBe("12.50000° N, 77.10000° W")
    expect(formatCoordinates(null, null)).toBe("—")
  })
})
