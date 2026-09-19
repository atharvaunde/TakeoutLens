import { CHAT } from "@/lib/constant"
import { splitHighlight } from "@/lib/helper"

/** Render an FTS snippet, highlighting matches with <mark> (no HTML injection: plain text only). */
export function HighlightedText({ snippet }: { snippet: string }) {
  return (
    <>
      {splitHighlight(snippet, CHAT.snippetStart, CHAT.snippetEnd).map((part, index) =>
        part.match ? (
          <mark key={index} className="rounded-sm bg-primary/20 px-0.5 text-foreground">
            {part.text}
          </mark>
        ) : (
          <span key={index}>{part.text}</span>
        )
      )}
    </>
  )
}
