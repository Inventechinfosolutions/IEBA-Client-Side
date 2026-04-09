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
  PencilLine,
  Folder,
  Home,
  User,
  Clock,
  Gauge,
  FileSpreadsheet,
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
import {
  IdCard,
  LockKeyhole,
  LogOut,
  Settings,
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { ChangePasswordFormModal } from "@/features/change-password"

const mainNav = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Personal Time Study", url: "/personal-time-study", icon: ScrollText },
  { title: "Master Code", url: "/master-code", icon: ScrollText },
  { title: "Program", url: "/program", icon: ScrollText },
  { title: "To Do", url: "/to-do", icon: ScrollText },
  { title: "Leave Approval", url: "/leave-approval", icon: ScrollText },
  { title: "User", url: "/user", icon: Users },
  { title: "Users", url: "/users", icon: Users },
  { title: "Department Role", url: "/department-role", icon: Building2 },
  { title: "County Activity Code", url: "/county-activity-code", icon: Table2 },
  { title: "Dashboard", url: "/", icon: Gauge },
  { title: "Personal Time Study", url: "/schedule-time-study", icon: Clock },
  { title: "Reports", url: "/reports", icon: FileSpreadsheet },
  { title: "To Do", url: "/to-do", icon: FileText },
  { title: "User", url: "/user", icon: User },
  { title: "Payroll", url: "/payroll", icon: CircleDollarSign },
  { title: "Department", url: "/department", icon: Home },
  { title: "Program", url: "/program", icon: Folder },
  { title: "County Activity Code", url: "/county-activity-code", icon: PencilLine },
  { title: "Master Code", url: "/master-code", icon: SquareTerminal },
  { title: "Department Role", url: "/department-role", icon: IdCard },
  { title: "Job Classification", url: "/job-classification", icon: LayoutGrid },
  { title: "Job Pool", url: "/job-pool", icon: Briefcase },
  { title: "Leave Approval", url: "/leave-approval", icon: FileText },
  { title: "FTE Allocation", url: "/fte-allocation", icon: FileText },
  { title: "Cost Pool", url: "/costpool", icon: FileText },
  { title: "Payroll", url: "/payroll", icon: CircleDollarSign },
  { title: "Schedule Time Study", url: "/schedule-time-study", icon: CalendarClock },
  { title: "Users", url: "/users", icon: Users },
] as const  

export function AppSidebar() {
  const { user, signOut } = useAuth()
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const location = useLocation()
  const permissions = user?.permissions ?? []
  const isSuperAdmin = Array.isArray(permissions) && permissions.includes("superadmin:all")

  const adminOnlyUrls = new Set([
    "/users",
    "/user",
    "/master-code",
    "/department-role",
    "/job-classification",
    "/job-pool",
    "/costpool",
    "/fte-allocation",
    "/payroll",
    "/department",
  ])

  const filteredNav = isSuperAdmin
    ? mainNav
    : mainNav.filter((item) => !adminOnlyUrls.has(item.url))

  const showUrl = (url: string) => isSuperAdmin || !adminOnlyUrls.has(url)

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
              {filteredNav.map((item, index) => {
                const isActive =
                  item.url === "/"
                    ? location.pathname === "/"
                    : location.pathname === item.url
                return (
                  <SidebarMenuItem key={`${item.url}-${item.title}-${index}`}>
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
                    <AvatarImage
                      src={user?.avatar}
                      alt={user?.name}
                    />
                    <AvatarFallback className="rounded-lg">
                      {user?.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2) ?? "U"}
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
                        {user?.name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2) ?? "U"}
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
                    <Link to="/">
                      <LayoutDashboard className="mr-2 size-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  {showUrl("/master-code") ? (
                    <DropdownMenuItem asChild>
                      <Link to="/master-code">
                        <ScrollText className="mr-2 size-4" />
                        Master Code
                      </Link>
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuItem asChild>
                    <Link to="/program">
                      <ScrollText className="mr-2 size-4" />
                      Program
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/reports">
                      <FileSpreadsheet className="mr-2 size-4" />
                      Reports
                    </Link>
                  </DropdownMenuItem>
                  {showUrl("/payroll") ? (
                    <DropdownMenuItem asChild>
                      <Link to="/payroll">
                        <CircleDollarSign className="mr-2 size-4" />
                        Payroll
                      </Link>
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuItem asChild>
                    <Link to="/to-do">
                      <ScrollText className="mr-2 size-4" />
                      To Do
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/leave-approval">
                      <ScrollText className="mr-2 size-4" />
                      Leave Approval
                    </Link>
                  </DropdownMenuItem>
                  {showUrl("/user") ? (
                    <DropdownMenuItem asChild>
                      <Link to="/user">
                        <Users className="mr-2 size-4" />
                        User
                      </Link>
                    </DropdownMenuItem>
                  ) : null}
                  {showUrl("/users") ? (
                    <DropdownMenuItem asChild>
                      <Link to="/users">
                        <Users className="mr-2 size-4" />
                        Users
                      </Link>
                    </DropdownMenuItem>
                  ) : null}
                  {showUrl("/department-role") ? (
                    <DropdownMenuItem asChild>
                      <Link to="/department-role">
                        <Building2 className="mr-2 size-4" />
                        Department Role
                      </Link>
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuItem asChild>
                    <Link to="/county-activity-code">
                      <Table2 className="mr-2 size-4" />
                      County Activity Code
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings">
                      <Settings className="mr-2 size-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/schedule-time-study">
                      <CalendarClock className="mr-2 size-4" />
                      Schedule Time Study
                    </Link>
                  </DropdownMenuItem>
                  {showUrl("/department") ? (
                    <DropdownMenuItem asChild>
                      <Link to="/department">
                        <Building2 className="mr-2 size-4" />
                        Department
                      </Link>
                    </DropdownMenuItem>
                  ) : null}
                  {showUrl("/costpool") ? (
                    <DropdownMenuItem asChild>
                      <Link to="/costpool">
                        <Table2 className="mr-2 size-4" />
                        Cost Pool
                      </Link>
                    </DropdownMenuItem>
                  ) : null}
                  {showUrl("/job-classification") ? (
                    <DropdownMenuItem asChild>
                      <Link to="/job-classification">
                        <Layers className="mr-2 size-4" />
                        Job Classification
                      </Link>
                    </DropdownMenuItem>
                  ) : null}
                  {showUrl("/job-pool") ? (
                    <DropdownMenuItem asChild>
                      <Link to="/job-pool">
                        <Layers className="mr-2 size-4" />
                        Job Pool
                      </Link>
                    </DropdownMenuItem>
                  ) : null}
                  {showUrl("/fte-allocation") ? (
                    <DropdownMenuItem asChild>
                      <Link to="/fte-allocation">
                        <BarChart2 className="mr-2 size-4" />
                        FTE Allocation
                      </Link>
                    </DropdownMenuItem>
                  ) : null}
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
