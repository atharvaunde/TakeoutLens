import { ModuleHeader } from "./module-header"

interface TablePageProps {
  title: string
  sub?: string
  /** Header controls (search, filters, tabs). */
  controls?: React.ReactNode
  children: React.ReactNode
}

/** Module page with a fixed header and a scrolling body (tables, boards, galleries). */
export function TablePage({ title, sub, controls, children }: TablePageProps) {
  return (
    <div className="flex h-full flex-col">
      <ModuleHeader title={title} sub={sub}>
        {controls}
      </ModuleHeader>
      <div className="min-h-0 flex-1 overflow-y-auto px-[18px] pt-3 pb-8">{children}</div>
    </div>
  )
}
