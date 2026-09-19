import { describe, expect, it } from "vitest"

import { parseVcf } from "@/server/services/contacts"

describe("parseVcf", () => {
  it("reads Google-style cards incl. item-prefixed keys, folded lines and fallbacks", () => {
    const cards = parseVcf(
      [
        "BEGIN:VCARD", "VERSION:3.0", "FN:Dr. Alice Example", "N:Example;Alice;;Dr.;", "item1.EMAIL;TYPE=INTERNET:alice@x.test", "item1.X-ABLabel:",
        "TEL;TYPE=CELL:+91 88006 47981", "ORG:Acme;Research", "NOTE:Line one\\nLine two,", " continued", "END:VCARD",
        "BEGIN:VCARD", "VERSION:3.0", "N:Doe;Jane;;;", "END:VCARD",
        "BEGIN:VCARD", "VERSION:3.0", "item1.EMAIL:only@email.test", "END:VCARD",
        "BEGIN:VCARD", "VERSION:3.0", "END:VCARD",
      ].join("\r\n")
    )
    expect(cards).toHaveLength(3) // the empty card is dropped
    expect(cards[0]).toMatchObject({ name: "Dr. Alice Example", emails: ["alice@x.test"], phones: ["+91 88006 47981"], org: "Acme Research" })
    expect(cards[0].note).toBe("Line one\nLine two,continued")
    expect(cards[1].name).toBe("Jane Doe")
    expect(cards[2].name).toBe("only@email.test")
  })
})
