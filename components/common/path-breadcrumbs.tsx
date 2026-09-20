import Link from "next/link"
import { Fragment } from "react"

interface PathBreadcrumbsProps {
  rootLabel: string
  rootHref: string
  items: { label: string; href: string }[]
}

/** Drive › Folder › Current: accent links with a faint › separator, current folder bold. */
export function PathBreadcrumbs({ rootLabel, rootHref, items }: PathBreadcrumbsProps) {
  const crumbs = [{ label: rootLabel, href: rootHref }, ...items]
  return (
    <nav className="flex min-w-0 items-center gap-1.5 text-[12.5px]">
      {crumbs.map((crumb, index) => (
        <Fragment key={crumb.href}>
          {index > 0 ? <span className="text-line">›</span> : null}
          {index === crumbs.length - 1 ? (
            <span className="truncate font-semibold">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="truncate text-acc hover:underline">
              {crumb.label}
            </Link>
          )}
        </Fragment>
      ))}
    </nav>
  )
}
