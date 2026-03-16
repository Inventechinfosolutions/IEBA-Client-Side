import { Outlet } from "react-router-dom"

import { AppSidebar } from "@/components/dashboard/AppSidebar"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export function DashboardLayout() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset className="bg-white">
        <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-sidebar-border bg-sidebar text-sidebar-foreground px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 text-sidebar-foreground">
            <SidebarTrigger className="-ml-1 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" variant="ghost" size="icon-sm" />
            <Separator
              orientation="vertical"
              className="mr-2 h-4 data-[orientation=vertical]:h-4 bg-sidebar-border"
            />
            <span className="text-sm font-medium">
              Bits of Time
            </span>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6 bg-[#F4F5FB]">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
