import { LockIcon } from "lucide-react"

import { AppSidebar } from "@/components/layout/app-sidebar"
import { Button } from "@/components/ui/button"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { logoutAction } from "@/server/actions/auth"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-12 items-center justify-between gap-2 border-b px-4">
          <SidebarTrigger />
          <form action={logoutAction}>
            <Button type="submit" variant="ghost" size="sm">
              <LockIcon data-icon="inline-start" />
              Lock
            </Button>
          </form>
        </header>
        <main className="flex flex-1 flex-col gap-6 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
