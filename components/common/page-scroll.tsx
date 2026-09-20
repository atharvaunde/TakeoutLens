import { cn } from "@/lib/utils"

/** Scrollable page body under the top bar (each module page fills the viewport and scrolls inside itself). */
export function PageScroll({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("h-full overflow-y-auto px-[18px] pt-3.5 pb-8", className)}>{children}</div>
}
