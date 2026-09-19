import { describe, expect, it } from "vitest"
import { formatBytes, formatDuration, getInitials, formatDate, parseTableParams, getFileKind, toFtsQuery } from "@/lib/helper"

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
})
