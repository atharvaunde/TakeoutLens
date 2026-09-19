import { describe, expect, it } from "vitest"

import { conversationTitle } from "@/server/indexer/chat"
import { parseChatDate } from "@/server/indexer/chat-date"

describe("parseChatDate", () => {
  it("parses the U+202F AM/PM format as UTC", () => {
    expect(parseChatDate("Tuesday, October 27, 2020 at 10:02:02 AM UTC")).toBe(Date.UTC(2020, 9, 27, 10, 2, 2))
    expect(parseChatDate("Monday, January 11, 2021 at 3:20:16 PM UTC")).toBe(Date.UTC(2021, 0, 11, 15, 20, 16))
  })
  it("handles 12 AM / 12 PM and plain spaces", () => {
    expect(parseChatDate("Friday, March 5, 2021 at 12:00:00 AM UTC")).toBe(Date.UTC(2021, 2, 5, 0, 0, 0))
    expect(parseChatDate("Friday, March 5, 2021 at 12:30:00 PM UTC")).toBe(Date.UTC(2021, 2, 5, 12, 30, 0))
  })
  it("rejects garbage and non-UTC zones", () => {
    expect(parseChatDate("yesterday")).toBeNull()
    expect(parseChatDate("Friday, March 5, 2021 at 12:30:00 PM IST")).toBeNull()
  })
})

describe("conversationTitle", () => {
  const members = [{ name: "Me", email: "me@x" }, { name: "Bob", email: "bob@x" }]
  it("uses the other person for DMs and the name for named spaces", () => {
    expect(conversationTitle("DM", undefined, members, "me@x")).toBe("Bob")
    expect(conversationTitle("Space", "Eng QA", members, "me@x")).toBe("Eng QA")
    expect(conversationTitle("Space", "Group Chat", members, "me@x")).toBe("Bob")
  })
})
