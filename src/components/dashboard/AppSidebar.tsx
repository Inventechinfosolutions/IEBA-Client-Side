import { useState } from "react"
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
  FileText,
  CircleDollarSign,
  Briefcase,
  LayoutGrid,
  SquareTerminal,
  IdCard,
  Folder,
  Home,
  User,
  FileSpreadsheet,
  ListTodo,
  User as UserIcon,
  type LucideIcon,
} from "lucide-react"

import iebaLogo from "@/assets/ieba-logo.png"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LockKeyhole, LogOut, Settings } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { usePermissions } from "@/hooks/usePermissions"
import { ChangePasswordFormModal } from "@/features/change-password"

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
  // ── Always visible ────────────────────────────────────────────────────────
  { title: "Dashboard",             url: "/",                      icon: LayoutDashboard,  permission: null },

  // ── Time Study ────────────────────────────────────────────────────────────
  { title: "Personal Time Study",   url: "/personal-time-study",   icon: ScrollText,       permission: "timestudypersonal" },
  { title: "Schedule Time Study",   url: "/schedule-time-study",   icon: CalendarClock,    permission: "scheduletimestudy" },

  // ── Program & Activities ──────────────────────────────────────────────────
  // /program has 3 tabs: Budget Units (budgetprogram), Time Study programs (timestudyprogram),
  // Program Activity Relation (timestudyactivity) — show if user can view ANY of them.
  { title: "Program",               url: "/program",               icon: Folder,           permission: ["budgetprogram", "timestudyprogram", "timestudyactivity"] },
  { title: "County Activity Code",  url: "/county-activity-code",  icon: Table2,           permission: "countyactivity" },

  // ── People & Leave ────────────────────────────────────────────────────────
  { title: "User",                  url: "/user",                  icon: User,             permission: "user" },
  { title: "Leave Approval",        url: "/leave-approval",        icon: FileText,         permission: "userleave:review" },

  // ── Finance ───────────────────────────────────────────────────────────────
  { title: "Payroll",               url: "/payroll",               icon: CircleDollarSign, permission: "payroll" },
  { title: "Cost Pool",             url: "/costpool",              icon: Layers,           permission: "costpool" },
  { title: "FTE Allocation",        url: "/fte-allocation",        icon: BarChart2,        permission: "costallocation" },

  // ── Reporting ─────────────────────────────────────────────────────────────
  { title: "Reports",               url: "/reports",               icon: FileSpreadsheet,  permission: "report" },
  { title: "To-Do",                 url: "/to-do",                 icon: ListTodo,         permission: "todo" },

  // ── Admin: needs "module:view" ────────────────────────────────────────────
  { title: "Department",            url: "/department",            icon: Home,             permission: "department" },
  { title: "Job Classification",    url: "/job-classification",    icon: LayoutGrid,       permission: "jobclassification" },
  { title: "Job Pool",              url: "/job-pool",              icon: Briefcase,        permission: "jobpool" },

  // ── Super-admin only (no permission key in the permission table) ──────────
  { title: "Users",                 url: "/users",                 icon: Users,            permission: "superadmin" },
  { title: "Department Role",       url: "/department-role",       icon: Building2,        permission: "superadmin" },
  { title: "Master Code",           url: "/master-code",           icon: SquareTerminal,   permission: "superadmin" },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function AppSidebar() {
  const { user, signOut } = useAuth()
  const { isSuperAdmin, canView, has } = usePermissions()
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
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

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user?.avatar} alt={user?.name} />
                    <AvatarFallback className="rounded-lg">
                      <UserIcon className="size-4 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {user?.name ?? "User"}
                    </span>
                    <span className="truncate text-xs text-sidebar-foreground/80">
                      {user?.email ?? ""}
                    </span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="top"
                align="start"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={user?.avatar} alt={user?.name} />
                      <AvatarFallback className="rounded-lg">
                        <UserIcon className="size-4 text-muted-foreground" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {user?.name ?? "User"}
                      </span>
                      <span className="truncate text-xs text-sidebar-foreground/80">
                        {user?.email ?? ""}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link to="/profile">
                      <IdCard className="mr-2 size-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault()
                      setChangePasswordOpen(true)
                    }}
                  >
                    <LockKeyhole className="mr-2 size-4" />
                    Change Password
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings">
                      <Settings className="mr-2 size-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 size-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <ChangePasswordFormModal
        open={changePasswordOpen}
        onOpenChange={setChangePasswordOpen}
      />
    </Sidebar>
  )
}
