import { describe, expect, it } from "vitest"

import { groupMessages } from "@/lib/chat"
import type { ChatMessageItem } from "@/lib/types"

const msg = (id: number, name: string, ts: number, isMine = false): ChatMessageItem => ({
  id, seq: id, ts, name, isBot: false, isMine, text: "x", attachments: [], reactions: [], quoted: null, links: [],
})
const t = (h: number, m = 0, day = 1) => Date.UTC(2023, 7, day, h, m)

describe("groupMessages", () => {
  it("groups consecutive same-sender messages close in time", () => {
    const groups = groupMessages([msg(1, "Me", t(9), true), msg(2, "Me", t(9, 2), true), msg(3, "Bob", t(9, 3)), msg(4, "Bob", t(9, 20))])
    expect(groups.map((g) => g.messages.map((m) => m.id))).toEqual([[1, 2], [3], [4]])
  })
  it("never groups across days or different senders", () => {
    const groups = groupMessages([msg(1, "Bob", t(23, 58)), msg(2, "Bob", t(0, 1, 2)), msg(3, "Ann", t(0, 2, 2))])
    expect(groups).toHaveLength(3)
  })
})
