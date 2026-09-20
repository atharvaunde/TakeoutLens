import { cn } from "@/lib/utils"

interface ModuleHeaderProps {
  title: string
  /** Mono sub-line under the title (counts, path, ...). */
  sub?: string
  /** Right-aligned controls (search, tabs). */
  children?: React.ReactNode
  className?: string
}

/** Page header used by module pages: title + mono sub-line on the left, controls on the right. */
export function ModuleHeader({ title, sub, children, className }: ModuleHeaderProps) {
  return (
    <div className={cn("flex flex-none flex-wrap items-center gap-2.5 border-b border-line px-[18px] pt-3.5 pb-2.5", className)}>
      <div>
        <div className="text-[17px] font-semibold tracking-[-.02em]">{title}</div>
        {sub ? <div className="mt-0.5 font-mono text-[11px] text-faint">{sub}</div> : null}
      </div>
      <div className="flex-1" />
      {children}
    </div>
  )
}
