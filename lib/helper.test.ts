import { describe, expect, it } from "vitest"
import { formatBytes, formatDuration, getInitials, formatDate } from "@/lib/helper"

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
})
