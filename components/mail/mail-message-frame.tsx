"use client"

import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { MAIL_TEXT, MAIL_VIEW } from "@/lib/constant"

interface MailMessageFrameProps {
  html: string | null
  text: string
}

const escapeHtml = (value: string) => value.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] as string)

/**
 * Untrusted message HTML renders inside a sandboxed iframe (no scripts, no same-origin) with a
 * CSP that blocks all network access. Remote images are opt-in per message.
 */
export function MailMessageFrame({ html, text }: MailMessageFrameProps) {
  const [allowRemote, setAllowRemote] = useState(false)
  const hasRemote = useMemo(() => Boolean(html && /<img[^>]+src=["']?https?:/i.test(html)), [html])

  const srcDoc = useMemo(() => {
    const csp = allowRemote ? MAIL_VIEW.cspRemote : MAIL_VIEW.cspBlocked
    const body = html ?? `<pre style="white-space:pre-wrap;font:inherit">${escapeHtml(text)}</pre>`
    return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${csp}"><base target="_blank"><style>body{margin:12px;font:14px/1.5 system-ui,sans-serif;color:#1a1a1a;background:#fff;word-wrap:break-word}img{max-width:100%;height:auto}</style></head><body>${body}</body></html>`
  }, [html, text, allowRemote])

  return (
    <div className="flex flex-col gap-2">
      {hasRemote && !allowRemote ? (
        <div className="flex items-center justify-between gap-2 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
          <span>{MAIL_TEXT.remoteBlocked}</span>
          <Button size="xs" variant="outline" onClick={() => setAllowRemote(true)}>
            {MAIL_TEXT.loadRemote}
          </Button>
        </div>
      ) : null}
      <iframe
        title="Message content"
        sandbox="allow-popups allow-popups-to-escape-sandbox"
        srcDoc={srcDoc}
        referrerPolicy="no-referrer"
        className="h-[55vh] w-full rounded-md border bg-white"
      />
    </div>
  )
}
