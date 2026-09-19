import { MonitorIcon } from "lucide-react"

import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { DESKTOP_ONLY_MESSAGE } from "@/lib/constant"

/**
 * Below the `lg` breakpoint the app is hidden and a block screen is shown.
 * Pure CSS (no JS), so there is no hydration flash on phones.
 */
export function DesktopOnlyGate({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div
        data-testid="desktop-only-block"
        className="fixed inset-0 z-50 hidden items-center justify-center bg-background max-lg:flex"
      >
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MonitorIcon />
            </EmptyMedia>
            <EmptyTitle>{DESKTOP_ONLY_MESSAGE.title}</EmptyTitle>
            <EmptyDescription>{DESKTOP_ONLY_MESSAGE.description}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
      <div data-testid="app-root" className="flex min-h-svh flex-col max-lg:hidden">
        {children}
      </div>
    </>
  )
}
