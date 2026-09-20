"use client"

import { useMemo, useState } from "react"

import { MAIL_TEXT, MAIL_VIEW } from "@/lib/constant"

interface MailMessageFrameProps {
  html: string | null
  text: string
}

const escapeHtml = (value: string) => value.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] as string)

/**
 * Untrusted message HTML renders inside a sandboxed iframe (no scripts, no same-origin) with a
 * CSP that blocks all network access. Remote images are opt-in per message.
 * (The iframe document is isolated, so its light "paper" colours cannot come from the app's CSS variables.)
 */
export function MailMessageFrame({ html, text }: MailMessageFrameProps) {
  const [allowRemote, setAllowRemote] = useState(false)
  const hasRemote = useMemo(() => Boolean(html && /<img[^>]+src=["']?https?:/i.test(html)), [html])

  const srcDoc = useMemo(() => {
    const csp = allowRemote ? MAIL_VIEW.cspRemote : MAIL_VIEW.cspBlocked
    const body = html ?? `<pre style="white-space:pre-wrap;font:inherit">${escapeHtml(text)}</pre>`
    return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${csp}"><base target="_blank"><style>body{margin:0;font:13.5px/1.7 system-ui,sans-serif;color:#3a424c;background:#fff;word-wrap:break-word}img{max-width:100%;height:auto}</style></head><body>${body}</body></html>`
  }, [html, text, allowRemote])

  return (
    <div className="flex flex-col gap-3">
      {hasRemote && !allowRemote ? (
        <div className="flex items-center justify-between gap-2.5 rounded-lg border border-dashed border-line bg-panel px-2.5 py-2">
          <div className="text-[11.5px] text-mute">{MAIL_TEXT.remoteBlocked}</div>
          <button type="button" onClick={() => setAllowRemote(true)} className="cursor-pointer text-[11.5px] font-medium whitespace-nowrap text-acc hover:underline">
            {MAIL_TEXT.loadRemote}
          </button>
        </div>
      ) : null}
      <iframe
        title="Message content"
        sandbox="allow-popups allow-popups-to-escape-sandbox"
        srcDoc={srcDoc}
        referrerPolicy="no-referrer"
        className="h-[52vh] w-full rounded-lg border border-line2 bg-white"
      />
    </div>
  )
}
