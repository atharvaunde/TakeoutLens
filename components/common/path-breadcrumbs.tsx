import Link from "next/link"
import { Fragment } from "react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

interface PathBreadcrumbsProps {
  rootLabel: string
  rootHref: string
  items: { label: string; href: string }[]
}

export function PathBreadcrumbs({ rootLabel, rootHref, items }: PathBreadcrumbsProps) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          {items.length === 0 ? <BreadcrumbPage>{rootLabel}</BreadcrumbPage> : (
            <BreadcrumbLink asChild>
              <Link href={rootHref}>{rootLabel}</Link>
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>
        {items.map((item, index) => (
          <Fragment key={item.href}>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {index === items.length - 1 ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={item.href}>{item.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
