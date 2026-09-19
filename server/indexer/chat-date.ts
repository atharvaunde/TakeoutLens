const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"]

// e.g. "Tuesday, October 27, 2020 at 10:02:02<U+202F>AM UTC" (Google uses a narrow no-break space before AM/PM)
const CHAT_DATE = /^\w+,\s+(\w+)\s+(\d{1,2}),\s+(\d{4})\s+at\s+(\d{1,2}):(\d{2}):(\d{2})[\s  ]*(AM|PM)\s+(\S+)$/i

/** Parse a Google Chat export date to epoch ms. The export always uses UTC; anything else returns null. */
export function parseChatDate(input: string): number | null {
  const match = CHAT_DATE.exec(input.trim())
  if (!match) return null
  const [, monthName, day, year, hour12, minute, second, meridiem, zone] = match
  if (zone.toUpperCase() !== "UTC") return null
  const month = MONTHS.indexOf(monthName.toLowerCase())
  if (month === -1) return null
  let hour = Number(hour12) % 12
  if (meridiem.toUpperCase() === "PM") hour += 12
  return Date.UTC(Number(year), month, Number(day), hour, Number(minute), Number(second))
}
