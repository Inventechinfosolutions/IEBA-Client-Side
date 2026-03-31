import { Link, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  ScrollText,
  Users,
  Building2,
  Table2,
  CalendarClock,
  Layers,
  BarChart2,
} from "lucide-react"

import iebaLogo from "@/assets/ieba-logo.png"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const mainNav = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Master Code", url: "/master-code", icon: ScrollText },
  { title: "Program", url: "/program", icon: ScrollText },
  { title: "To Do", url: "/to-do", icon: ScrollText },
  { title: "Leave Approval", url: "/leave-approval", icon: ScrollText },
  { title: "User", url: "/user", icon: Users },
  { title: "Users", url: "/users", icon: Users },
  { title: "Department Role", url: "/department-role", icon: Building2 },
  { title: "County Activity Code", url: "/county-activity-code", icon: Table2 },
  { title: "Schedule Time Study", url: "/schedule-time-study", icon: CalendarClock },
  { title: "Department", url: "/department", icon: Building2 },
  { title: "Cost Pool", url: "/costpool", icon: Table2 },
  { title: "Job Classification", url: "/job-classification", icon: Layers },
  { title: "Job Pool", url: "/job-pool", icon: Layers },
  { title: "FTE Allocation", url: "/fte-allocation", icon: BarChart2 },
] as const

export function AppSidebar() {
  const location = useLocation()

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6C5DD3]/10">
                    <img
                      src={iebaLogo}
                      alt="IEBA logo"
                      className="h-12 w-12 object-contain"
                    />
                  </div>
                  <div className="grid flex-1 text-left leading-tight">
                    <span className="truncate text-[27px]  text-[#111827]">
                      I E B A
                    </span>
                    
                  </div>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => {
                const isActive =
                  item.url === "/"
                    ? location.pathname === "/"
                    : location.pathname === item.url
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link to={item.url}>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
