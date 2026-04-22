import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import {
  Users,
  CalendarClock,
  Layers,
  FileText,
  CircleDollarSign,
  Briefcase,
  LayoutGrid,
  SquareTerminal,
  Home,
  User,
  ListTodo,
  Gauge,
  Clock,
  ClipboardCheck,
  SquarePen,
  ScrollText,
  type LucideIcon,
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
  SidebarFooter,
} from "@/components/ui/sidebar"
import { usePermissions } from "@/hooks/usePermissions"

// ---------------------------------------------------------------------------
// Nav definition
// permission: null        → always visible (e.g. Dashboard)
// permission: "superadmin" → only visible when user has superadmin:all
// permission: "module"    → visible when user has "module:view"
// ---------------------------------------------------------------------------
type NavItem = {
  title: string
  url: string
  icon: LucideIcon
  /**
   * null          → always show
   * "superadmin"   → only when user has superadmin:all
   * "moduleKey"    → show when user has moduleKey:view
   * "moduleKey:action" → show when user has exact permission
   * ["a", "b"]     → show when user has ANY of the listed module :view permissions (OR)
   */
  permission: string | string[] | null
}

const mainNav: NavItem[] = [
  { title: "Dashboard",             url: "/",                      icon: Gauge,            permission: null },
  { title: "Personal Time Study",   url: "/personal-time-study",   icon: Clock,            permission: "timestudypersonal" },
  { title: "To-Do",                 url: "/to-do",                 icon: ListTodo,         permission: "todo" },
  { title: "User",                  url: "/user",                  icon: User,             permission: "user" },
  { title: "Reports",               url: "/reports",               icon: FileText,         permission: "report" },
  { title: "Payroll",               url: "/payroll",               icon: CircleDollarSign, permission: "payroll" },
  { title: "Department",            url: "/department",            icon: Home,             permission: null },
  { title: "Program",               url: "/program",               icon: ClipboardCheck,   permission: ["budgetprogram", "timestudyprogram", "timestudyactivity"] },
  { title: "County Activity Code",  url: "/county-activity-code",  icon: SquarePen,        permission: "countyactivity" },
  { title: "Master Code",           url: "/master-code",           icon: SquareTerminal,   permission: "mastercode" },
  { title: "Department Role",       url: "/department-role",       icon: ScrollText,       permission: "superadmin" },
  { title: "Job Classification",    url: "/job-classification",    icon: LayoutGrid,       permission: "jobclassification" },
  { title: "Job Pool",              url: "/job-pool",              icon: Briefcase,        permission: "jobpool" },
  { title: "Leave Approval",        url: "/leave-approval",        icon: FileText,         permission: "userleave:review" },
  { title: "FTE Allocation",        url: "/fte-allocation",        icon: FileText,         permission: "superadmin" },
  { title: "Cost Pool",             url: "/costpool",              icon: Layers,           permission: "costpool" },
  { title: "Schedule Time Study",   url: "/schedule-time-study",   icon: CalendarClock,    permission: "scheduletimestudy" },
  { title: "Users",                 url: "/users",                 icon: Users,            permission: "superadmin" },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function AppSidebar() {
  const { isSuperAdmin, canView, has } = usePermissions()
  const location = useLocation()

  /** Returns true when the nav item should be visible to this user. */
  function isVisible(item: NavItem): boolean {
    if (item.permission === null) return true                    // always show
    if (item.permission === "superadmin") return isSuperAdmin    // superadmin-only pages
    if (isSuperAdmin) return true                               // superadmin sees everything
    // Array → OR logic: visible if user has :view for ANY listed module
    if (Array.isArray(item.permission)) {
      return item.permission.some((mod) => mod.includes(":") ? has(mod) : canView(mod))
    }
    return item.permission.includes(":") ? has(item.permission) : canView(item.permission) // single module :view check or specific permission
  }

  const filteredNav = mainNav.filter(isVisible)

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
                    <span className="truncate text-[27px] text-[#111827]">
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
              {filteredNav.map((item) => {
                const isActive =
                  item.url === "/"
                    ? location.pathname === "/"
                    : location.pathname === item.url ||
                      location.pathname.startsWith(item.url + "/")
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={cn(
                        "relative rounded-none!",
                        isActive && "text-[#6C5DD3] bg-[#6C5DD3]/5"
                      )}
                    >
                      <Link to={item.url} className="flex w-full items-center">
                        <item.icon className={cn("size-4", isActive && "text-[#6C5DD3]")} />
                        <span className="flex-1">{item.title}</span>
                        {isActive && (
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-[2px] bg-[#6C5DD3]" />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="h-[40px] bg-white border-none" />
    </Sidebar>
  )
}
